const CACHE_TTL_MS = 30 * 60 * 1000;
const YOUTUBE_BASE = "https://www.googleapis.com/youtube/v3";

const state = globalThis.__commentubeState ?? {
  keyIndex: 0,
  cache: new Map()
};

globalThis.__commentubeState = state;

export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function getApiKeys() {
  const keys = [
    ...(process.env.YOUTUBE_API_KEYS || "").split(","),
    process.env.YOUTUBE_API_KEY || ""
  ]
    .map((key) => key.trim())
    .filter(Boolean);

  return [...new Set(keys)];
}

export function extractVideoId(input = "") {
  const value = String(input).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;

  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      if (/^[a-zA-Z0-9_-]{11}$/.test(id || "")) return id;

      const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) return shortsMatch[1];

      const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];
    }
  } catch {
    return null;
  }

  return null;
}

export function getCache(key) {
  const hit = state.cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.createdAt > CACHE_TTL_MS) {
    state.cache.delete(key);
    return null;
  }
  return hit.value;
}

export function setCache(key, value) {
  state.cache.set(key, { createdAt: Date.now(), value });
  return value;
}

export function secondsFromDuration(duration = "PT0S") {
  const match = duration.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, d = 0, h = 0, m = 0, s = 0] = match.map((part) => Number(part || 0));
  return d * 86400 + h * 3600 + m * 60 + s;
}

export function formatDuration(seconds) {
  const value = Number(seconds || 0);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;
  if (hours) return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function isRetryableKeyError(payload, status) {
  const reason = payload?.error?.errors?.[0]?.reason || payload?.error?.status;
  return (
    status === 403 ||
    reason === "quotaExceeded" ||
    reason === "dailyLimitExceeded" ||
    reason === "keyInvalid" ||
    reason === "accessNotConfigured"
  );
}

export async function youtubeFetch(path, params = {}) {
  const keys = getApiKeys();
  if (!keys.length) {
    throw new ApiError(500, "YouTube API key가 설정되어 있지 않습니다. YOUTUBE_API_KEYS를 등록해주세요.");
  }

  let lastPayload = null;
  for (let attempt = 0; attempt < keys.length; attempt += 1) {
    const index = (state.keyIndex + attempt) % keys.length;
    const key = keys[index];
    const url = new URL(`${YOUTUBE_BASE}/${path}`);
    Object.entries({ ...params, key }).forEach(([name, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(name, String(value));
      }
    });

    const response = await fetch(url);
    const payload = await response.json().catch(() => null);

    if (response.ok) {
      state.keyIndex = (index + 1) % keys.length;
      return payload;
    }

    lastPayload = payload;
    if (!isRetryableKeyError(payload, response.status)) {
      throw new ApiError(response.status, payload?.error?.message || "YouTube API 요청에 실패했습니다.", payload);
    }
  }

  throw new ApiError(429, "등록된 YouTube API key를 모두 사용할 수 없습니다.", lastPayload);
}

export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

export function handleError(res, error) {
  const status = error instanceof ApiError ? error.status : 500;
  sendJson(res, status, {
    error: error.message || "알 수 없는 오류가 발생했습니다.",
    details: error.details || null
  });
}
