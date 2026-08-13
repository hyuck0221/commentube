import fs from "node:fs";
import { ApiError } from "./_youtube.js";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

const state = globalThis.__commentubeGeminiState ?? {
  freeKeyIndex: 0,
  paidKeyIndex: 0
};

state.freeKeyIndex = Number.isInteger(state.freeKeyIndex) ? state.freeKeyIndex : Number(state.keyIndex) || 0;
state.paidKeyIndex = Number.isInteger(state.paidKeyIndex) ? state.paidKeyIndex : 0;
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

function getGeminiKeys(names) {
  const keys = names
    .flatMap((name) => [process.env[name] || readLocalEnvValue(name) || ""])
    .flatMap((value) => value.split(","))
    .map((key) => key.trim())
    .filter(Boolean);

  return [...new Set(keys)];
}

function getGeminiKeyGroups() {
  const freeTierKeys = getGeminiKeys(["GEMINI_FREE_TIER_API_KEYS", "GEMINI_FREE_TIER_API_KEY"]);
  const paidKeys = getGeminiKeys(["GEMINI_PAID_API_KEYS", "GEMINI_PAID_API_KEY"]);
  const legacyKeys = getGeminiKeys(["GEMINI_API_KEYS", "GEMINI_API_KEY"]);

  return {
    freeTierKeys: freeTierKeys.length ? freeTierKeys : legacyKeys,
    paidKeys
  };
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL || readLocalEnvValue("GEMINI_MODEL") || "gemini-2.5-flash";
}

function isRetryableGeminiError(payload, status) {
  const code = payload?.error?.status;
  const message = payload?.error?.message || "";
  return (
    status === 401 ||
    status === 403 ||
    status === 408 ||
    status === 429 ||
    status >= 500 ||
    code === "RESOURCE_EXHAUSTED" ||
    code === "UNAVAILABLE" ||
    code === "DEADLINE_EXCEEDED" ||
    code === "INTERNAL" ||
    code === "ABORTED" ||
    /quota|rate.?limit|resource exhausted|temporarily unavailable|overloaded|api key.*(invalid|not valid)|invalid.*api key/i.test(
      message
    )
  );
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
  const { freeTierKeys, paidKeys } = getGeminiKeyGroups();
  const keyGroups = [
    { keys: freeTierKeys, stateKey: "freeKeyIndex" },
    { keys: paidKeys, stateKey: "paidKeyIndex" }
  ];

  if (!freeTierKeys.length && !paidKeys.length) {
    throw new ApiError(
      500,
      "Gemini API key가 설정되어 있지 않습니다. GEMINI_FREE_TIER_API_KEYS 또는 GEMINI_PAID_API_KEYS를 등록해주세요."
    );
  }

  const model = getGeminiModel();
  let lastPayload = null;
  let lastStatus = 503;

  for (const { keys, stateKey } of keyGroups) {
    if (!keys.length) continue;

    const startIndex = ((state[stateKey] % keys.length) + keys.length) % keys.length;
    for (let attempt = 0; attempt < keys.length; attempt += 1) {
      const index = (startIndex + attempt) % keys.length;
      const key = keys[index];
      let response;
      let payload;

      try {
        response = await fetch(`${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
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
        payload = await response.json().catch(() => null);
      } catch {
        state[stateKey] = (index + 1) % keys.length;
        continue;
      }

      state[stateKey] = (index + 1) % keys.length;
      if (response.ok) {
        return parseGeminiJson(payload);
      }

      lastPayload = payload;
      lastStatus = response.status;
      if (!isRetryableGeminiError(payload, response.status)) {
        throw new ApiError(response.status, payload?.error?.message || "Gemini API 요청에 실패했습니다.", payload);
      }
    }
  }

  throw new ApiError(
    lastStatus === 429 ? 429 : 503,
    "프리티어와 결제용 Gemini API key를 모두 사용할 수 없습니다.",
    lastPayload
  );
}

export async function generateStructuredJson({ prompt, schema, temperature = 0.75, validate = null }) {
  const payload = await generateGeminiStructuredJson({ prompt, schema, temperature });
  return validateProviderPayload("Gemini", payload, validate);
}
