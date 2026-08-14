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
import { verifyRecaptcha } from "./_recaptcha.js";

const RECAPTCHA_ACTION = "analyze_video";

export default async function handler(req, res) {
  try {
    await verifyRecaptcha(req, RECAPTCHA_ACTION);

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
    const commentCount = Number(item.statistics?.commentCount || 0);
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
      commentCount,
      games: [
        {
          id: "comment-battle",
          title: "좋아요 배틀",
          available: commentCount >= 100,
          minimumCommentCount: 100,
          status: commentCount >= 100 ? "플레이 가능" : "댓글 100개 이상 영상부터 플레이 가능"
        },
        {
          id: "reply-battle",
          title: "대댓글 배틀",
          available: commentCount >= 100,
          minimumCommentCount: 100,
          status: commentCount >= 100 ? "플레이 가능" : "댓글 100개 이상 영상부터 플레이 가능"
        },
        {
          id: "real-comment",
          title: "AI 댓글 찾기",
          available: commentCount >= 100,
          minimumCommentCount: 100,
          status: commentCount >= 100 ? "플레이 가능" : "댓글 100개 이상 영상부터 플레이 가능"
        },
        {
          id: "timeline",
          title: "타임라인 맞추기",
          available: commentCount >= 50,
          minimumCommentCount: 50,
          status: commentCount >= 50 ? "플레이 가능" : "댓글 50개 이상 영상부터 플레이 가능"
        },
        {
          id: "comment-tools",
          title: "댓글 추첨/추출",
          available: commentCount > 0 && commentCount <= 10000,
          maximumCommentCount: 10000,
          status:
            commentCount > 10000
              ? "댓글 1만개 이하 영상에서만 사용 가능"
              : commentCount > 0
                ? "사용 가능"
                : "댓글이 있는 영상에서 사용 가능"
        }
      ]
    };

    return sendJson(res, 200, setCache(cacheKey, payload));
  } catch (error) {
    return handleError(res, error);
  }
}
