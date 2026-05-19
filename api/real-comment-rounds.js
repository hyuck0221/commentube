import { generateStructuredJson } from "./_gemini.js";
import { ApiError, extractVideoId, getCache, getQueryParam, handleError, sendJson, setCache, youtubeFetch } from "./_youtube.js";
import { fetchCommentsForVideo } from "./comments.js";

const MIN_PLAYABLE_COMMENTS = 100;
const AI_SAMPLE_COMMENT_COUNT = 50;
const DEFAULT_AI_BATCH = 40;
const MAX_CANDIDATE_COUNT = 10;
const MIN_CANDIDATE_COUNT = 2;

const languageLabels = {
  ko: "Korean",
  en: "English",
  ja: "Japanese"
};

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sanitizeAiComment(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .replace(/^["']|["']$/g, "")
    .trim()
    .slice(0, 240);
}

function extractAiCommentText(comment) {
  if (typeof comment === "string") return comment;
  if (!comment || typeof comment !== "object") return "";
  return comment.text || comment.comment || comment.content || comment.message || "";
}

function normalizeAiCommentPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.comments)) return payload.comments;
  if (Array.isArray(payload?.fake_comments)) return payload.fake_comments;
  if (Array.isArray(payload?.fakeComments)) return payload.fakeComments;
  if (Array.isArray(payload?.ai_comments)) return payload.ai_comments;
  if (Array.isArray(payload?.aiComments)) return payload.aiComments;
  return [];
}

function buildAiCommentsFromPayload(payload, sampleComments) {
  const seen = new Set(sampleComments.map((comment) => comment.text.trim().toLowerCase()));

  return normalizeAiCommentPayload(payload)
    .map((comment, index) => ({
      id: `ai-${Date.now()}-${index}`,
      text: sanitizeAiComment(extractAiCommentText(comment)),
      type: "ai"
    }))
    .filter((comment) => comment.text.length >= 4)
    .filter((comment) => {
      const key = comment.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, DEFAULT_AI_BATCH);
}

function authorKey(comment) {
  return String(comment?.author || "").trim().toLowerCase();
}

function takeUniqueRealChoices(pool, needed) {
  const choices = [];
  const usedAuthors = new Set();

  for (let index = 0; index < pool.length && choices.length < needed; ) {
    const comment = pool[index];
    const key = authorKey(comment);

    if (key && !usedAuthors.has(key)) {
      choices.push(comment);
      usedAuthors.add(key);
      pool.splice(index, 1);
      continue;
    }

    index += 1;
  }

  return choices;
}

function uniqueAuthors(comments) {
  const byAuthor = new Map();

  for (const comment of comments) {
    const key = authorKey(comment);
    if (!key || byAuthor.has(key)) continue;
    byAuthor.set(key, {
      author: comment.author,
      maskedAuthor: comment.maskedAuthor
    });
  }

  return [...byAuthor.values()];
}

function pickBorrowedAuthor(authorPool, blockedAuthors) {
  const candidates = authorPool.filter((author) => !blockedAuthors.has(String(author.author || "").trim().toLowerCase()));
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

async function fetchVideoMeta(videoId) {
  const data = await youtubeFetch("videos", {
    part: "snippet,statistics,contentDetails",
    id: videoId
  });
  const item = data.items?.[0];
  if (!item) throw new ApiError(404, "영상을 찾을 수 없습니다.");
  return {
    title: item.snippet?.title || "",
    channelTitle: item.snippet?.channelTitle || "",
    description: (item.snippet?.description || "").slice(0, 500),
    commentCount: Number(item.statistics?.commentCount || 0)
  };
}

function buildPrompt({ video, comments, language, count }) {
  const samples = shuffle(comments)
    .slice(0, AI_SAMPLE_COMMENT_COUNT)
    .map((comment, index) => `${index + 1}. ${comment.text}`)
    .join("\n");

  return `
You are creating fake YouTube comments for a party guessing game.
The player sees several comments and must find the single AI-written comment.

Video:
- Title: ${video.title}
- Channel: ${video.channelTitle}
- Description excerpt: ${video.description}

Real comment samples:
${samples}

Generate ${count} original fake comments in ${languageLabels[language] || "Korean"}.
Rules:
- First infer the video's topic, tone, memorable moments, and likely viewer reactions from the title, channel, description, and samples.
- Make every comment feel like a real viewer wrote it after watching this specific video, not like a generic compliment.
- Refer naturally to the video's situation, people, result, joke, opinion, mood, or takeaway when the samples suggest it.
- Closely match the sample comments' language style: casualness, sentence length, spacing, slang, laughter markers, emoji frequency, punctuation, abbreviations, and typo level.
- Preserve the comment section's vibe. If samples are dry, be dry. If they are excited, witty, sarcastic, emotional, or fandom-like, reflect that.
- Write like many different people, with varied reactions and confidence levels. Some comments can be simple, some specific, some funny, some observational.
- Do not copy, paraphrase too closely, or lightly edit any real sample.
- Avoid robotic explanations, polished review language, over-complete sentences, and phrases that sound like marketing copy.
- Avoid vague comments that could fit any video, such as "great video", "so funny", or "this is amazing", unless the samples are mostly that style.
- Do not mention AI, bots, guessing games, or that the comment is fake.
- Avoid hate, threats, sexual content, private information, spam, and slurs.
- Mix short comments, medium comments, reactions, jokes, questions, and tiny personal takes.
- Do not include timestamps or timecode-like text such as 0:42, 12:03, or 1:02:33.
- Keep each comment under 180 characters unless the samples are naturally longer.
Return only valid JSON in exactly this shape:
{"comments":[{"text":"first fake comment"},{"text":"second fake comment"}]}
`.trim();
}

async function generateAiComments({ videoId, language, sampleComments, fresh }) {
  const cacheKey = `ai-comments:${videoId}:${language}`;
  if (!fresh) {
    const cached = getCache(cacheKey);
    if (cached) return { ...cached, cachedAi: true };
  }

  const video = await fetchVideoMeta(videoId);
  const schema = {
    type: "object",
    properties: {
      comments: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: { type: "string" }
          },
          required: ["text"]
        }
      }
    },
    required: ["comments"]
  };

  const payload = await generateStructuredJson({
    prompt: buildPrompt({ video, comments: sampleComments, language, count: DEFAULT_AI_BATCH }),
    schema,
    validate: (candidatePayload) => buildAiCommentsFromPayload(candidatePayload, sampleComments).length >= 10
  });

  const aiComments = buildAiCommentsFromPayload(payload, sampleComments);

  if (aiComments.length < 10) {
    throw new ApiError(502, "AI 댓글 후보를 충분히 만들지 못했습니다. 다시 시도해주세요.");
  }

  return setCache(cacheKey, { aiComments, cachedAi: false });
}

function buildRealCommentRounds({ comments, aiComments, candidateCount }) {
  const realPool = shuffle(
    comments
      .filter((comment) => comment.text.length >= 4 && comment.text.length <= 260)
      .filter((comment) => authorKey(comment))
      .map((comment) => ({ ...comment, type: "real" }))
  );
  const authorPool = uniqueAuthors(realPool);
  const rounds = [];

  for (const aiComment of aiComments) {
    const realNeeded = candidateCount - 1;
    const realChoices = takeUniqueRealChoices(realPool, realNeeded);
    if (realChoices.length < realNeeded) break;

    const roundAuthors = new Set(realChoices.map(authorKey));
    const borrowedAuthor = pickBorrowedAuthor(authorPool, roundAuthors);
    if (!borrowedAuthor) break;

    const disguisedAiComment = {
      ...aiComment,
      author: borrowedAuthor.author,
      maskedAuthor: borrowedAuthor.maskedAuthor
    };

    const choices = shuffle([...realChoices, disguisedAiComment]).map((choice, index) => ({
      ...choice,
      choiceId: `choice-${rounds.length + 1}-${index + 1}`
    }));
    const answer = choices.find((choice) => choice.type === "ai")?.choiceId;
    rounds.push({
      id: `real-round-${rounds.length + 1}`,
      choices,
      answer
    });
  }

  return rounds;
}

export default async function handler(req, res) {
  try {
    const rawUrl = getQueryParam(req, "url") || getQueryParam(req, "videoId");
    const videoId = extractVideoId(rawUrl);
    if (!videoId) throw new ApiError(400, "올바른 YouTube 영상 링크를 입력해주세요.");

    const candidateCount = Math.min(
      Math.max(Number(getQueryParam(req, "candidateCount") || 4), MIN_CANDIDATE_COUNT),
      MAX_CANDIDATE_COUNT
    );
    const language = getQueryParam(req, "language") || "ko";
    const fresh = getQueryParam(req, "fresh") === "1";
    const commentsCacheKey = `real-comments:${videoId}:260`;
    let comments = getCache(commentsCacheKey);
    const commentsCached = Boolean(comments);

    if (!comments) {
      comments = await fetchCommentsForVideo(videoId, 260);
      setCache(commentsCacheKey, comments);
    }

    if (comments.length < MIN_PLAYABLE_COMMENTS) {
      throw new ApiError(422, `댓글을 ${comments.length}개만 불러왔습니다. 댓글 100개 이상인 영상에서 플레이할 수 있어요.`);
    }

    const sampleComments = shuffle(comments.filter((comment) => comment.text.length >= 4 && comment.text.length <= 220)).slice(
      0,
      AI_SAMPLE_COMMENT_COUNT
    );
    const { aiComments, cachedAi } = await generateAiComments({ videoId, language, sampleComments, fresh });
    const rounds = buildRealCommentRounds({ comments, aiComments, candidateCount });

    if (rounds.length < 6) {
      throw new ApiError(422, "진짜 댓글 찾기 라운드를 만들 댓글 후보가 부족합니다.");
    }

    return sendJson(res, 200, {
      videoId,
      candidateCount,
      totalFetched: comments.length,
      aiGenerated: aiComments.length,
      cached: commentsCached,
      cachedAi,
      rounds,
      expiresInSeconds: 1800
    });
  } catch (error) {
    return handleError(res, error);
  }
}
