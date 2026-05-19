import fs from "node:fs";
import { ApiError } from "./_youtube.js";

const GROQ_BASE = "https://api.groq.com/openai/v1";
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

function getGroqKey() {
  return process.env.GROQ_API_KEY || readLocalEnvValue("GROQ_API_KEY") || "";
}

function getGroqModel() {
  return process.env.GROQ_MODEL || readLocalEnvValue("GROQ_MODEL") || "llama-3.1-8b-instant";
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL || readLocalEnvValue("GEMINI_MODEL") || "gemini-2.5-flash";
}

function providerMessage(providerName, message) {
  return `${providerName} API 요청에 실패했습니다: ${message}`;
}

function isMissingKeyError(error) {
  return error?.status === 500 && /API key/i.test(error?.message || "");
}

function isRetryableGeminiError(payload, status) {
  const code = payload?.error?.status;
  return status === 429 || status >= 500 || code === "RESOURCE_EXHAUSTED" || code === "UNAVAILABLE";
}

function parseOpenAiJson(payload, providerName) {
  const text = payload?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new ApiError(502, `${providerName}가 댓글을 생성하지 못했습니다.`, payload);

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new ApiError(502, `${providerName} 응답을 JSON으로 해석할 수 없습니다.`, { text });
  }
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

async function generateGroqStructuredJson({ prompt, temperature }) {
  const key = getGroqKey();
  if (!key) {
    throw new ApiError(500, "Groq API key가 설정되어 있지 않습니다. GROQ_API_KEY를 등록해주세요.");
  }

  const response = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: getGroqModel(),
      messages: [
        {
          role: "system",
          content:
            'You generate JSON for an app. Return only valid JSON with no markdown, no code fences, and no extra text. The root object must be {"comments":[{"text":"..."}]}.'
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature,
      response_format: { type: "json_object" }
    })
  });

  const payload = await response.json().catch(() => null);
  if (response.ok) return parseOpenAiJson(payload, "Groq");

  throw new ApiError(response.status, payload?.error?.message || "Groq API 요청에 실패했습니다.", payload);
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
  const providerErrors = [];

  try {
    const payload = await generateGroqStructuredJson({ prompt, temperature });
    return validateProviderPayload("Groq", payload, validate);
  } catch (error) {
    if (!isMissingKeyError(error)) {
      providerErrors.push(providerMessage("Groq", error.message || "알 수 없는 오류"));
    }
  }

  try {
    const payload = await generateGeminiStructuredJson({ prompt, schema, temperature });
    return validateProviderPayload("Gemini", payload, validate);
  } catch (error) {
    if (!isMissingKeyError(error)) {
      providerErrors.push(providerMessage("Gemini", error.message || "알 수 없는 오류"));
    }

    const message = providerErrors.length
      ? `AI 댓글 생성에 실패했습니다. ${providerErrors.join(" / ")}`
      : "AI API key가 설정되어 있지 않습니다. GROQ_API_KEY 또는 GEMINI_API_KEYS를 등록해주세요.";

    throw new ApiError(error.status || 502, message, {
      providerErrors,
      fallbackProvider: "gemini"
    });
  }
}
