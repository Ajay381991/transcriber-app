import { auth } from "@/auth";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data", "history");

function getUserFile(userId) {
  return path.join(DATA_DIR, `${userId.replace(/[^a-zA-Z0-9]/g, "_")}.json`);
}

function readHistory(userId) {
  const file = getUserFile(userId);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

function writeHistory(userId, history) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(getUserFile(userId), JSON.stringify(history, null, 2));
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const history = readHistory(session.user.email);
  return NextResponse.json({ history });
}

export async function POST(req) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileName, fileSize, language, transcript } = await req.json();
  const history = readHistory(session.user.email);

  const entry = {
    id: Date.now().toString(),
    fileName,
    fileSize,
    language: language || "Auto",
    transcript,
    createdAt: new Date().toISOString(),
  };

  history.unshift(entry);
  const trimmed = history.slice(0, 50);
  writeHistory(session.user.email, trimmed);

  return NextResponse.json({ entry });
}

export async function DELETE(req) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const history = readHistory(session.user.email);
  const updated = id === "all" ? [] : history.filter((e) => e.id !== id);
  writeHistory(session.user.email, updated);

  return NextResponse.json({ ok: true });
}
