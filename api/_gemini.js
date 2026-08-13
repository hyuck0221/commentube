import fs from "node:fs";
import { ApiError } from "./_youtube.js";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

const state = globalThis.__commentubeGeminiState ?? {
  keyIndex: 0
};

globalThis.__commentubeGeminiState = state;

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

function getGeminiKeys() {
  const keys = [
    ...(process.env.GEMINI_API_KEYS || readLocalEnvValue("GEMINI_API_KEYS") || "").split(","),
    process.env.GEMINI_API_KEY || readLocalEnvValue("GEMINI_API_KEY") || ""
  ]
    .map((key) => key.trim())
    .filter(Boolean);

  return [...new Set(keys)];
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL || readLocalEnvValue("GEMINI_MODEL") || "gemini-2.5-flash";
}

function isRetryableGeminiError(payload, status) {
  const code = payload?.error?.status;
  return status === 429 || status >= 500 || code === "RESOURCE_EXHAUSTED" || code === "UNAVAILABLE";
}

function parseGeminiJson(payload) {
  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!text) throw new ApiError(502, "Gemini가 댓글을 생성하지 못했습니다.", payload);

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new ApiError(502, "Gemini 응답을 JSON으로 해석할 수 없습니다.", { text });
  }
}

function validateProviderPayload(providerName, payload, validate) {
  if (!validate) return payload;

  try {
    if (validate(payload)) return payload;
  } catch (error) {
    throw new ApiError(502, `${providerName} 응답을 사용할 수 없습니다: ${error.message || "검증 실패"}`, payload);
  }

  throw new ApiError(502, `${providerName} 응답을 사용할 수 없습니다: 필요한 데이터를 충분히 만들지 못했습니다.`, payload);
}

async function generateGeminiStructuredJson({ prompt, schema, temperature }) {
  const keys = getGeminiKeys();
  if (!keys.length) {
    throw new ApiError(500, "Gemini API key가 설정되어 있지 않습니다. GEMINI_API_KEYS를 등록해주세요.");
  }

  const model = getGeminiModel();
  let lastPayload = null;

  for (let attempt = 0; attempt < keys.length; attempt += 1) {
    const index = (state.keyIndex + attempt) % keys.length;
    const key = keys[index];
    const response = await fetch(`${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
          responseJsonSchema: schema
        }
      })
    });

    const payload = await response.json().catch(() => null);
    if (response.ok) {
      state.keyIndex = (index + 1) % keys.length;
      return parseGeminiJson(payload);
    }

    lastPayload = payload;
    if (!isRetryableGeminiError(payload, response.status)) {
      throw new ApiError(response.status, payload?.error?.message || "Gemini API 요청에 실패했습니다.", payload);
    }
  }

  throw new ApiError(429, "등록된 Gemini API key를 모두 사용할 수 없습니다.", lastPayload);
}

export async function generateStructuredJson({ prompt, schema, temperature = 0.75, validate = null }) {
  const payload = await generateGeminiStructuredJson({ prompt, schema, temperature });
  return validateProviderPayload("Gemini", payload, validate);
}
