import { ApiError, extractVideoId, getCache, getQueryParam, handleError, sendJson, setCache } from "./_youtube.js";
import { fetchRepliesForComment } from "./comments.js";

const MAX_PARENT_COMMENTS = 2;

export default async function handler(req, res) {
  try {
    const rawUrl = getQueryParam(req, "url") || getQueryParam(req, "videoId");
    const videoId = extractVideoId(rawUrl);
    if (!videoId) throw new ApiError(400, "올바른 YouTube 영상 링크를 입력해주세요.");

    const parentIds = [...new Set(String(getQueryParam(req, "commentIds") || "").split(",").map((id) => id.trim()).filter(Boolean))];
    if (!parentIds.length || parentIds.length > MAX_PARENT_COMMENTS) {
      throw new ApiError(400, "대댓글을 불러올 댓글을 두 개까지 지정해주세요.");
    }

    const cacheKey = `reply-battle-replies:${videoId}:${parentIds.join(",")}`;
    const cached = getCache(cacheKey);
    if (cached) return sendJson(res, 200, { ...cached, cached: true });

    const replyEntries = await Promise.all(
      parentIds.map(async (parentId) => {
        const replies = await fetchRepliesForComment({ id: parentId, author: "", text: "" });
        return [parentId, replies];
      })
    );

    const payload = {
      videoId,
      replies: Object.fromEntries(replyEntries),
      cached: false,
      expiresInSeconds: 1800
    };

    return sendJson(res, 200, setCache(cacheKey, payload));
  } catch (error) {
    return handleError(res, error);
  }
}
