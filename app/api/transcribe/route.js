import { NextResponse } from "next/server";

const LANGUAGE_NAMES = {
  en: "English", hi: "Hindi", ur: "Urdu", bn: "Bengali",
  ta: "Tamil", te: "Telugu", mr: "Marathi", gu: "Gujarati",
  kn: "Kannada", ml: "Malayalam", pa: "Punjabi", ar: "Arabic",
  zh: "Chinese", fr: "French", de: "German", es: "Spanish",
  pt: "Portuguese", ru: "Russian", ja: "Japanese", ko: "Korean",
  tr: "Turkish", it: "Italian", nl: "Dutch", fa: "Persian",
};

// ─── IP-based rate limiter ───────────────────────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT = 10;
const WINDOW_MS = 24 * 60 * 60 * 1000;

function getClientIP(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function consumeRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const timestamps = (rateLimitMap.get(ip) || []).filter((t) => t > windowStart);
  const remaining = RATE_LIMIT - timestamps.length;
  const oldestInWindow = timestamps[0] ?? now;
  const resetAt = new Date(oldestInWindow + WINDOW_MS).toISOString();
  if (remaining <= 0) return { allowed: false, remaining: 0, resetAt };
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return { allowed: true, remaining: remaining - 1, resetAt };
}

// ─── Retry helper ────────────────────────────────────────────────────────────
async function fetchWithRetry(url, options, maxRetries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
    }
  }
  throw lastError ?? new Error("Request failed after retries");
}

// ─── Route handler ───────────────────────────────────────────────────────────
export async function POST(req) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const ip = getClientIP(req);
  const { allowed, remaining, resetAt } = consumeRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      {
        error: "Daily transcription limit reached. Please try again tomorrow.",
        requestsRemaining: 0,
        limitResetAt: resetAt,
      },
      { status: 429 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const outputLang = formData.get("outputLang");

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const groqForm = new FormData();
  groqForm.append("file", file);
  groqForm.append("model", "whisper-large-v3-turbo");

  const groqRes = await fetchWithRetry(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: groqForm,
    }
  );

  const data = await groqRes.json();

  if (!groqRes.ok) {
    return NextResponse.json(
      { error: data?.error?.message || "Transcription failed" },
      { status: groqRes.status }
    );
  }

  let text = data.text;
  let translationFailed = false;

  if (outputLang && LANGUAGE_NAMES[outputLang]) {
    try {
      const translateRes = await fetchWithRetry(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: `You are a translator. Translate the given text to ${LANGUAGE_NAMES[outputLang]}. Output only the translated text, nothing else.`,
              },
              { role: "user", content: text },
            ],
            temperature: 0.3,
          }),
        }
      );
      const translateData = await translateRes.json();
      const translated = translateData.choices?.[0]?.message?.content?.trim();
      if (translateRes.ok && translated) {
        text = translated;
      } else {
        translationFailed = true;
      }
    } catch {
      translationFailed = true;
    }
  }

  return NextResponse.json({
    text,
    translationFailed,
    requestsRemaining: remaining,
    limitResetAt: resetAt,
    meta: {
      id: Date.now().toString(),
      fileName: file.name,
      fileSize: file.size,
      language: outputLang ? (LANGUAGE_NAMES[outputLang] || "Original") : "Original",
      createdAt: new Date().toISOString(),
    },
  });
}
