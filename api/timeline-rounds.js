import { ApiError, extractVideoId, getCache, getQueryParam, handleError, sendJson, setCache } from "./_youtube.js";
import { fetchAllCommentsForVideo } from "./comments.js";

const MIN_TIMELINE_COMMENTS = 50;
const TIMELINE_MAX_COMMENTS = 10000;
const TIMESTAMP_PATTERN = /\b(?:(\d{1,2}:)?[0-5]?\d:[0-5]\d)\b/g;

function timestampToSeconds(value) {
  const parts = value.split(":").map(Number);
  if (parts.some((part) => Number.isNaN(part))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function extractTimestamps(text = "", durationSeconds = 0) {
  return [...String(text).matchAll(TIMESTAMP_PATTERN)]
    .map((match) => ({
      label: match[0],
      seconds: timestampToSeconds(match[0])
    }))
    .filter(({ seconds }) => seconds !== null && (!durationSeconds || seconds <= durationSeconds));
}

function maskTimestamps(text = "") {
  return String(text).replace(TIMESTAMP_PATTERN, (label) => label.split(":").map(() => "??").join(":"));
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function buildTimelineRounds(comments, durationSeconds) {
  const maxTimestamp = comments.reduce((max, comment) => {
    const timestamp = extractTimestamps(comment.text, durationSeconds)[0];
    return Math.max(max, timestamp?.seconds || 0);
  }, 0);
  const timelineDurationSeconds = Math.max(Number(durationSeconds) || 0, maxTimestamp + 60, 60);
  const guessWindowSeconds = Math.min(
    timelineDurationSeconds,
    Math.max(8, Math.min(45, Math.round(timelineDurationSeconds * 0.08)))
  );

  return shuffle(
    comments
      .map((comment) => {
        const timestamp = extractTimestamps(comment.text, durationSeconds)[0];
        if (!timestamp) return null;

        return {
          id: `timeline-round-${comment.id}`,
          text: maskTimestamps(comment.text),
          author: comment.author,
          maskedAuthor: comment.maskedAuthor,
          timestampSeconds: timestamp.seconds,
          timestampLabel: timestamp.label,
          durationSeconds: timelineDurationSeconds,
          guessWindowSeconds
        };
      })
      .filter(Boolean)
  );
}

export { buildTimelineRounds, extractTimestamps, maskTimestamps };

export default async function handler(req, res) {
  try {
    const rawUrl = getQueryParam(req, "url") || getQueryParam(req, "videoId");
    const videoId = extractVideoId(rawUrl);
    if (!videoId) throw new ApiError(400, "올바른 YouTube 영상 링크를 입력해주세요.");

    const fresh = getQueryParam(req, "fresh") === "1";
    const requestedDuration = Number(getQueryParam(req, "durationSeconds") || 0);
    const cacheKey = `timeline-rounds:${videoId}:${requestedDuration}`;
    if (!fresh) {
      const cached = getCache(cacheKey);
      if (cached) return sendJson(res, 200, { ...cached, cached: true });
    }

    const comments = await fetchAllCommentsForVideo(videoId, TIMELINE_MAX_COMMENTS);
    if (comments.length < MIN_TIMELINE_COMMENTS) {
      throw new ApiError(
        422,
        `댓글을 ${comments.length}개만 불러왔습니다. 타임라인 맞추기는 댓글 ${MIN_TIMELINE_COMMENTS}개 이상인 영상에서 플레이할 수 있어요.`
      );
    }

    const rounds = buildTimelineRounds(comments, requestedDuration);
    if (!rounds.length) {
      throw new ApiError(422, "타임스탬프가 있는 댓글이 없어 타임라인 맞추기를 시작할 수 없습니다.");
    }

    const payload = {
      videoId,
      totalFetched: comments.length,
      timestampCommentCount: rounds.length,
      rounds,
      cached: false,
      expiresInSeconds: 1800
    };

    return sendJson(res, 200, setCache(cacheKey, payload));
  } catch (error) {
    return handleError(res, error);
  }
}
