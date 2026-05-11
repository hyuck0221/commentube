import { ApiError, extractVideoId, getCache, getQueryParam, handleError, sendJson, setCache, youtubeFetch } from "./_youtube.js";
import { fetchAllCommentsForVideo, fetchAllCommentsWithRepliesForVideo } from "./comments.js";

const MAX_UTILITY_COMMENTS = 10000;

async function getVideoCommentCount(videoId) {
  const data = await youtubeFetch("videos", {
    part: "statistics",
    id: videoId,
    maxResults: 1
  });
  const item = data.items?.[0];
  if (!item) throw new ApiError(404, "영상을 찾을 수 없습니다.");
  return Number(item.statistics?.commentCount || 0);
}

export default async function handler(req, res) {
  try {
    const rawUrl = getQueryParam(req, "url") || getQueryParam(req, "videoId");
    const videoId = extractVideoId(rawUrl);
    if (!videoId) throw new ApiError(400, "올바른 YouTube 영상 링크를 입력해주세요.");

    const includeReplies = getQueryParam(req, "includeReplies") === "1";
    const commentCount = await getVideoCommentCount(videoId);
    if (commentCount > MAX_UTILITY_COMMENTS) {
      throw new ApiError(422, "댓글 추첨과 추출은 댓글 1만개 이하 영상에서만 사용할 수 있어요.");
    }

    const cacheKey = `utility-comments:${videoId}:${MAX_UTILITY_COMMENTS}:${includeReplies ? "with-replies" : "top-level"}`;
    const cached = getCache(cacheKey);
    if (cached) return sendJson(res, 200, { ...cached, cached: true });

    const target = Math.min(commentCount || MAX_UTILITY_COMMENTS, MAX_UTILITY_COMMENTS);
    const comments = includeReplies
      ? await fetchAllCommentsWithRepliesForVideo(videoId, target)
      : await fetchAllCommentsForVideo(videoId, target);
    const payload = {
      videoId,
      commentCount,
      totalFetched: comments.length,
      includeReplies,
      comments,
      cached: false,
      expiresInSeconds: 1800
    };

    return sendJson(res, 200, setCache(cacheKey, payload));
  } catch (error) {
    return handleError(res, error);
  }
}
