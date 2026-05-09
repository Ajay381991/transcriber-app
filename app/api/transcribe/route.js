import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

const LANGUAGE_NAMES = {
  en: "English", hi: "Hindi", ur: "Urdu", bn: "Bengali",
  ta: "Tamil", te: "Telugu", mr: "Marathi", gu: "Gujarati",
  kn: "Kannada", ml: "Malayalam", pa: "Punjabi", ar: "Arabic",
  zh: "Chinese", fr: "French", de: "German", es: "Spanish",
  pt: "Portuguese", ru: "Russian", ja: "Japanese", ko: "Korean",
  tr: "Turkish", it: "Italian", nl: "Dutch", fa: "Persian",
};

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const groqRes = await fetch(
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

  if (outputLang && LANGUAGE_NAMES[outputLang]) {
    const targetLanguage = LANGUAGE_NAMES[outputLang];
    const translateRes = await fetch(
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
              content: `You are a translator. Translate the given text to ${targetLanguage}. Output only the translated text, nothing else.`,
            },
            { role: "user", content: text },
          ],
          temperature: 0.3,
        }),
      }
    );

    const translateData = await translateRes.json();
    if (translateRes.ok) {
      text = translateData.choices?.[0]?.message?.content || text;
    }
  }

  return NextResponse.json({
    text,
    meta: {
      id: Date.now().toString(),
      fileName: file.name,
      fileSize: file.size,
      language: outputLang ? (LANGUAGE_NAMES[outputLang] || "Original") : "Original",
      createdAt: new Date().toISOString(),
    },
  });
}
