import fs from "node:fs";
import { ApiError, getQueryParam } from "./_youtube.js";

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const DEFAULT_MIN_SCORE = 0.5;

function readLocalEnvValue(name) {
  if (process.env.VERCEL_ENV === "production") return "";

  try {
    for (const file of [".env.local", ".env"]) {
      const path = `${process.cwd()}/${file}`;
      if (!fs.existsSync(path)) continue;

      const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (!match || match[1] !== name) continue;
        return match[2].replace(/^["']|["']$/g, "").trim();
      }
    }
  } catch {
    return "";
  }

  return "";
}

function getRecaptchaSecret() {
  return process.env.RECAPTCHA_SECRET_KEY || readLocalEnvValue("RECAPTCHA_SECRET_KEY") || "";
}

function getMinScore() {
  const value = Number(process.env.RECAPTCHA_MIN_SCORE || readLocalEnvValue("RECAPTCHA_MIN_SCORE") || DEFAULT_MIN_SCORE);
  if (!Number.isFinite(value)) return DEFAULT_MIN_SCORE;
  return Math.min(Math.max(value, 0), 1);
}

function getRemoteIp(req) {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "";
}

export async function verifyRecaptcha(req, expectedAction) {
  const secret = getRecaptchaSecret();
  if (!secret) return { skipped: true };

  const token = getQueryParam(req, "recaptchaToken");
  if (!token) {
    throw new ApiError(403, "reCAPTCHA 검증 토큰이 없습니다. 다시 시도해주세요.");
  }

  const body = new URLSearchParams({
    secret,
    response: token
  });
  const remoteIp = getRemoteIp(req);
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch(RECAPTCHA_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    throw new ApiError(403, "reCAPTCHA 검증에 실패했습니다. 잠시 후 다시 시도해주세요.", payload);
  }

  if (payload.action !== expectedAction) {
    throw new ApiError(403, "reCAPTCHA action이 올바르지 않습니다.", payload);
  }

  if (Number(payload.score || 0) < getMinScore()) {
    throw new ApiError(403, "자동화된 요청으로 판단되어 차단되었습니다. 잠시 후 다시 시도해주세요.", payload);
  }

  return payload;
}
