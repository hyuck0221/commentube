import {
  ApiError,
  extractVideoId,
  getCache,
  getQueryParam,
  handleError,
  sendJson,
  setCache
} from "./_youtube.js";
import { fetchCommentsForVideo } from "./comments.js";

const MIN_PLAYABLE_COMMENTS = 100;
const DEFAULT_TARGET = 520;
const MAX_TARGET = 900;

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function bucketShuffleByReplies(comments) {
  const bucketSize = 32;
  const buckets = [];

  for (let index = 0; index < comments.length; index += bucketSize) {
    buckets.push(shuffle(comments.slice(index, index + bucketSize)));
  }

  return buckets.flatMap((bucket, bucketIndex) => {
    if (bucketIndex < 2) return bucket;
    const priorDrift = Math.random() < 0.18 ? buckets[Math.max(bucketIndex - 1, 0)].slice(0, 2) : [];
    return shuffle([...bucket, ...priorDrift]).filter((comment, index, list) => {
      return list.findIndex((item) => item.id === comment.id) === index;
    });
  });
}

function roundComment(comment) {
  return {
    id: comment.id,
    text: comment.text,
    author: comment.author,
    maskedAuthor: comment.maskedAuthor,
    likeCount: comment.likeCount,
    replyCount: comment.replyCount,
    publishedAt: comment.publishedAt
  };
}

export function buildReplyBattleRounds(comments) {
  const eligible = comments
    .filter((comment) => comment.text.length >= 6 && comment.text.length <= 280)
    .filter((comment) => comment.replyCount > 0)
    .sort((a, b) => b.replyCount - a.replyCount);

  const strongPool = bucketShuffleByReplies(eligible.slice(0, Math.min(eligible.length, 520)));
  const pairs = [];
  const used = new Set();

  for (let index = 0; index < strongPool.length - 1; index += 1) {
    const left = strongPool[index];
    if (used.has(left.id)) continue;

    let bestIndex = -1;
    let bestGap = Number.POSITIVE_INFINITY;
    const candidates = [];

    for (let candidateIndex = index + 1; candidateIndex < strongPool.length; candidateIndex += 1) {
      const right = strongPool[candidateIndex];
      if (used.has(right.id) || right.id === left.id) continue;
      const maxReplies = Math.max(left.replyCount, right.replyCount);
      const gapRatio = Math.abs(left.replyCount - right.replyCount) / Math.max(maxReplies, 1);

      if (left.replyCount !== right.replyCount && gapRatio <= 0.72) {
        candidates.push({ index: candidateIndex, gapRatio });
      }

      if (left.replyCount !== right.replyCount && gapRatio < bestGap) {
        bestGap = gapRatio;
        bestIndex = candidateIndex;
      }
    }

    if (candidates.length) {
      candidates.sort((a, b) => a.gapRatio - b.gapRatio);
      const closeCandidates = candidates.slice(0, Math.min(candidates.length, 12));
      bestIndex = closeCandidates[Math.floor(Math.random() * closeCandidates.length)].index;
    }

    if (bestIndex >= 0) {
      const right = strongPool[bestIndex];
      used.add(left.id);
      used.add(right.id);
      pairs.push(Math.random() > 0.5 ? [left, right] : [right, left]);
    }
  }

  return pairs.map(([left, right], index) => ({
    id: `reply-round-${index + 1}`,
    left: roundComment(left),
    right: roundComment(right),
    answer: left.replyCount > right.replyCount ? "left" : "right"
  }));
}

export default async function handler(req, res) {
  try {
    const rawUrl = getQueryParam(req, "url") || getQueryParam(req, "videoId");
    const videoId = extractVideoId(rawUrl);
    if (!videoId) throw new ApiError(400, "올바른 YouTube 영상 링크를 입력해주세요.");

    const target = Math.min(Number(getQueryParam(req, "target") || DEFAULT_TARGET), MAX_TARGET);
    const fresh = getQueryParam(req, "fresh") === "1";
    const cacheKey = `reply-battle:${videoId}:${target}`;
    const cached = fresh ? null : getCache(cacheKey);
    if (cached) return sendJson(res, 200, { ...cached, cached: true });

    const comments = await fetchCommentsForVideo(videoId, target);
    if (comments.length < MIN_PLAYABLE_COMMENTS) {
      throw new ApiError(
        422,
        `댓글을 ${comments.length}개만 불러왔습니다. 댓글 ${MIN_PLAYABLE_COMMENTS}개 이상인 영상에서 플레이할 수 있어요.`
      );
    }

    const rounds = buildReplyBattleRounds(comments);
    if (rounds.length < 8) {
      throw new ApiError(422, "대댓글이 있는 댓글 후보가 부족해서 대댓글 배틀을 만들 수 없습니다.");
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
