import {
  ApiError,
  extractVideoId,
  formatDuration,
  getCache,
  getQueryParam,
  handleError,
  secondsFromDuration,
  sendJson,
  setCache,
  youtubeFetch
} from "./_youtube.js";

export default async function handler(req, res) {
  try {
    const rawUrl = getQueryParam(req, "url") || getQueryParam(req, "videoId");
    const videoId = extractVideoId(rawUrl);
    if (!videoId) throw new ApiError(400, "올바른 YouTube 영상 링크를 입력해주세요.");

    const cacheKey = `video:${videoId}`;
    const cached = getCache(cacheKey);
    if (cached) return sendJson(res, 200, { ...cached, cached: true });

    const data = await youtubeFetch("videos", {
      part: "snippet,statistics,contentDetails",
      id: videoId,
      maxResults: 1
    });

    const item = data.items?.[0];
    if (!item) throw new ApiError(404, "영상을 찾을 수 없습니다.");

    const durationSeconds = secondsFromDuration(item.contentDetails?.duration);
    const payload = {
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: item.snippet?.title || "제목 없음",
      channelTitle: item.snippet?.channelTitle || "",
      publishedAt: item.snippet?.publishedAt || "",
      thumbnail:
        item.snippet?.thumbnails?.maxres?.url ||
        item.snippet?.thumbnails?.standard?.url ||
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        "",
      durationSeconds,
      durationLabel: formatDuration(durationSeconds),
      viewCount: Number(item.statistics?.viewCount || 0),
      likeCount: Number(item.statistics?.likeCount || 0),
      commentCount: Number(item.statistics?.commentCount || 0),
      games: [
        {
          id: "comment-battle",
          title: "댓글 배틀",
          available: Number(item.statistics?.commentCount || 0) >= 100,
          minimumCommentCount: 100,
          status:
            Number(item.statistics?.commentCount || 0) >= 100
              ? "플레이 가능"
              : "댓글 100개 이상 영상부터 플레이 가능"
        },
        {
          id: "real-comment",
          title: "진짜 댓글 찾기",
          available: false,
          status: "AI 모드 준비 중"
        }
      ]
    };

    return sendJson(res, 200, setCache(cacheKey, payload));
  } catch (error) {
    return handleError(res, error);
  }
}
