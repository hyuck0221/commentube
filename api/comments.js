import {
  ApiError,
  extractVideoId,
  getCache,
  getQueryParam,
  handleError,
  sendJson,
  setCache,
  youtubeFetch
} from "./_youtube.js";

const MIN_PLAYABLE_COMMENTS = 100;
const DEFAULT_TARGET = 420;
const MAX_TARGET = 900;

function cleanText(value = "") {
  return String(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function maskAuthor(name = "") {
  const compact = String(name).trim();
  if (!compact) return "익명";
  if (compact.length <= 2) return `${compact[0]}*`;
  return `${compact[0]}${"*".repeat(Math.min(compact.length - 2, 8))}${compact.at(-1)}`;
}

function baseCommentFields(snippet = {}, id = "") {
  const author = snippet.authorDisplayName || "익명";
  return {
    id,
    text: cleanText(snippet.textDisplay || snippet.textOriginal || ""),
    author,
    maskedAuthor: maskAuthor(author),
    likeCount: Number(snippet.likeCount || 0),
    publishedAt: snippet.publishedAt || "",
    updatedAt: snippet.updatedAt || ""
  };
}

function normalizeComment(item, source) {
  const comment = item.snippet?.topLevelComment;
  const snippet = comment?.snippet || {};
  return {
    ...baseCommentFields(snippet, comment?.id || item.id),
    replyCount: Number(item.snippet?.totalReplyCount || 0),
    isReply: false,
    parentId: "",
    parentAuthor: "",
    parentText: "",
    source
  };
}

function normalizeReply(item, parent) {
  const snippet = item.snippet || {};
  return {
    ...baseCommentFields(snippet, item.id),
    replyCount: 0,
    isReply: true,
    parentId: parent.id,
    parentAuthor: parent.author,
    parentText: parent.text,
    source: "reply"
  };
}

async function fetchCommentLane(videoId, order, targetCount, maxPages = 10) {
  const comments = [];
  let pageToken = "";
  let safety = 0;

  while (comments.length < targetCount && safety < maxPages) {
    safety += 1;
    const data = await youtubeFetch("commentThreads", {
      part: "snippet",
      videoId,
      order,
      maxResults: 100,
      textFormat: "plainText",
      pageToken
    });

    comments.push(...(data.items || []).map((item) => normalizeComment(item, order)));
    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }

  return comments;
}

export async function fetchCommentsForVideo(videoId, target) {
  const [relevance, time] = await Promise.all([
    fetchCommentLane(videoId, "relevance", Math.ceil(target * 0.65)),
    fetchCommentLane(videoId, "time", Math.ceil(target * 0.45))
  ]);

  const byId = new Map();
  [...relevance, ...time].forEach((comment) => {
    if (comment.id && !byId.has(comment.id)) byId.set(comment.id, comment);
  });

  return [...byId.values()];
}

export async function fetchAllCommentsForVideo(videoId, target = 10000) {
  const maxCount = Math.min(Number(target || 10000), 10000);
  const comments = await fetchCommentLane(videoId, "time", maxCount, Math.ceil(maxCount / 100));
  const byId = new Map();

  comments.forEach((comment) => {
    if (comment.id && !byId.has(comment.id)) byId.set(comment.id, comment);
  });

  return [...byId.values()].slice(0, maxCount);
}

export async function fetchRepliesForComment(parent) {
  const replies = [];
  let pageToken = "";
  let safety = 0;

  while (safety < 100) {
    safety += 1;
    const data = await youtubeFetch("comments", {
      part: "snippet",
      parentId: parent.id,
      maxResults: 100,
      textFormat: "plainText",
      pageToken
    });

    replies.push(...(data.items || []).map((item) => normalizeReply(item, parent)));
    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }

  return replies;
}

export async function fetchAllCommentsWithRepliesForVideo(videoId, target = 10000) {
  const topLevelComments = await fetchAllCommentsForVideo(videoId, target);
  const commentsWithReplies = [];
  const parentsWithReplies = topLevelComments.filter((comment) => comment.replyCount > 0);
  const repliesByParent = new Map();
  const batchSize = 6;

  for (let index = 0; index < parentsWithReplies.length; index += batchSize) {
    const batch = parentsWithReplies.slice(index, index + batchSize);
    const replies = await Promise.all(batch.map((parent) => fetchRepliesForComment(parent)));
    replies.forEach((parentReplies, batchIndex) => {
      repliesByParent.set(batch[batchIndex].id, parentReplies);
    });
  }

  topLevelComments.forEach((comment) => {
    commentsWithReplies.push(comment);
    commentsWithReplies.push(...(repliesByParent.get(comment.id) || []));
  });

  return commentsWithReplies;
}

function buildBattleRounds(comments) {
  const eligible = comments
    .filter((comment) => comment.text.length >= 6 && comment.text.length <= 280)
    .filter((comment) => comment.likeCount > 0)
    .sort((a, b) => b.likeCount - a.likeCount);

  const strongPool = bucketShuffleByLikes(eligible.slice(0, Math.min(eligible.length, 520)));
  const pairs = [];
  const used = new Set();

  for (let i = 0; i < strongPool.length - 1; i += 1) {
    const left = strongPool[i];
    if (used.has(left.id)) continue;

    let bestIndex = -1;
    let bestGap = Number.POSITIVE_INFINITY;
    const candidates = [];

    for (let j = i + 1; j < strongPool.length; j += 1) {
      const right = strongPool[j];
      if (used.has(right.id) || right.id === left.id) continue;
      const maxLikes = Math.max(left.likeCount, right.likeCount);
      const gapRatio = Math.abs(left.likeCount - right.likeCount) / Math.max(maxLikes, 1);

      if (left.likeCount !== right.likeCount && gapRatio <= 0.72) {
        candidates.push({ index: j, gapRatio });
      }

      if (left.likeCount !== right.likeCount && gapRatio < bestGap) {
        bestGap = gapRatio;
        bestIndex = j;
      }
    }

    if (candidates.length) {
      candidates.sort((a, b) => a.gapRatio - b.gapRatio);
      const slice = candidates.slice(0, Math.min(candidates.length, 12));
      bestIndex = slice[Math.floor(Math.random() * slice.length)].index;
    }

    if (bestIndex >= 0) {
      const right = strongPool[bestIndex];
      used.add(left.id);
      used.add(right.id);
      pairs.push(Math.random() > 0.5 ? [left, right] : [right, left]);
    }
  }

  return pairs.map(([left, right], index) => ({
    id: `round-${index + 1}`,
    left,
    right,
    answer: left.likeCount > right.likeCount ? "left" : "right"
  }));
}

function bucketShuffleByLikes(comments) {
  const bucketSize = 32;
  const buckets = [];

  for (let i = 0; i < comments.length; i += bucketSize) {
    buckets.push(shuffle(comments.slice(i, i + bucketSize)));
  }

  return buckets.flatMap((bucket, bucketIndex) => {
    if (bucketIndex < 2) return bucket;
    const priorDrift = Math.random() < 0.18 ? buckets[Math.max(bucketIndex - 1, 0)].slice(0, 2) : [];
    return shuffle([...bucket, ...priorDrift]).filter((comment, index, list) => {
      return list.findIndex((item) => item.id === comment.id) === index;
    });
  });
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default async function handler(req, res) {
  try {
    const rawUrl = getQueryParam(req, "url") || getQueryParam(req, "videoId");
    const videoId = extractVideoId(rawUrl);
    if (!videoId) throw new ApiError(400, "올바른 YouTube 영상 링크를 입력해주세요.");

    const target = Math.min(Number(getQueryParam(req, "target") || DEFAULT_TARGET), MAX_TARGET);
    const cacheKey = `comments:${videoId}:${target}`;
    const cached = getCache(cacheKey);
    if (cached) return sendJson(res, 200, { ...cached, cached: true });

    const comments = await fetchCommentsForVideo(videoId, target);
    if (comments.length < MIN_PLAYABLE_COMMENTS) {
      throw new ApiError(422, `댓글을 ${comments.length}개만 불러왔습니다. 댓글 100개 이상인 영상에서 플레이할 수 있어요.`);
    }

    const rounds = buildBattleRounds(comments);
    if (rounds.length < 8) {
      throw new ApiError(422, "좋아요가 있는 댓글 후보가 부족해서 좋아요 배틀을 만들 수 없습니다.");
    }

    const payload = {
      videoId,
      totalFetched: comments.length,
      rounds,
      cached: false,
      expiresInSeconds: 1800
    };

    return sendJson(res, 200, setCache(cacheKey, payload));
  } catch (error) {
    return handleError(res, error);
  }
}
