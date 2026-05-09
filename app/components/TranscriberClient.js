"use client";
import { useState, useRef, useCallback } from "react";
import HistoryPanel from "./HistoryPanel";
import { useToast } from "./Toast";

const SUPPORTED_FORMATS = ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm", "ogg", "flac"];
const MAX_SIZE_MB = 25;
const WARN_SIZE_MB = 20;

const LANGUAGES = [
  { code: "original", label: "Keep Original (no translation)" },
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ur", label: "Urdu" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "mr", label: "Marathi" },
  { code: "gu", label: "Gujarati" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
  { code: "pa", label: "Punjabi" },
  { code: "ar", label: "Arabic" },
  { code: "zh", label: "Chinese" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
  { code: "ru", label: "Russian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "tr", label: "Turkish" },
  { code: "it", label: "Italian" },
  { code: "nl", label: "Dutch" },
  { code: "fa", label: "Persian" },
];

export function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDuration(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

async function getAudioDuration(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = new AudioCtx();
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    ctx.close();
    return decoded.duration;
  } catch {
    return null;
  }
}

export function validateFile(f) {
  const ext = f.name.split(".").pop().toLowerCase();
  if (!SUPPORTED_FORMATS.includes(ext))
    return `Unsupported format ".${ext}". Supported: ${SUPPORTED_FORMATS.join(", ")}`;
  if (f.size > MAX_SIZE_MB * 1024 * 1024)
    return `File too large (${formatBytes(f.size)}). Max is ${MAX_SIZE_MB} MB.`;
  return null;
}

function getWordCount(text) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

const STATUS_LABELS = {
  idle: "",
  uploading: "Uploading…",
  transcribing: "Transcribing…",
  translating: "Translating…",
};

const HISTORY_KEY = "transcriber_history";

function saveToLocalHistory(entry) {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    const history = stored ? JSON.parse(stored) : [];
    history.unshift(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch {}
}

export default function TranscriberClient() {
  const { toast } = useToast();

  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(null);
  const [fileSizeWarning, setFileSizeWarning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [outputLang, setOutputLang] = useState("original");
  const [transcript, setTranscript] = useState("");
  const [transcriptFileName, setTranscriptFileName] = useState("");
  const [translationFailed, setTranslationFailed] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [requestsRemaining, setRequestsRemaining] = useState(null);
  const [newEntry, setNewEntry] = useState(null);
  const inputRef = useRef(null);

  const loading = status !== "idle";

  const handleFile = useCallback(async (f) => {
    setError(""); setTranscript(""); setTranslationFailed(false); setDuration(null);
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setFile(f);
    setFileSizeWarning(f.size > WARN_SIZE_MB * 1024 * 1024);
    const dur = await getAudioDuration(f);
    setDuration(dur);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const transcribe = async () => {
    if (!file) return;
    setError(""); setTranscript(""); setTranslationFailed(false);

    try {
      setStatus("uploading");
      const fd = new FormData();
      fd.append("file", file);
      if (outputLang !== "original") fd.append("outputLang", outputLang);

      setStatus("transcribing");
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Transcription failed");

      if (outputLang !== "original") {
        setStatus("translating");
        await new Promise((r) => setTimeout(r, 0));
      }

      setTranscript(data.text);
      setTranscriptFileName(file.name);
      setTranslationFailed(!!data.translationFailed);

      if (typeof data.requestsRemaining === "number") {
        setRequestsRemaining(data.requestsRemaining);
      }

      // Save to localStorage history
      const entry = { ...data.meta, transcript: data.text };
      saveToLocalHistory(entry);
      setNewEntry(entry);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus("idle");
    }
  };

  const reset = () => {
    setFile(null); setDuration(null); setFileSizeWarning(false);
    setTranscript(""); setTranscriptFileName(""); setError(""); setTranslationFailed(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcript).then(() => {
      toast({ message: "Transcript copied to clipboard!", variant: "success" });
    });
  };

  const downloadTranscript = () => {
    const baseName = transcriptFileName.replace(/\.[^.]+$/, "") || "transcript";
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = transcript ? getWordCount(transcript) : 0;
  const charCount = transcript ? transcript.length : 0;

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-8">
      {/* Navbar */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm">Audio Transcriber</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-600 text-xs">Free · No sign-in required</span>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-white font-bold text-xl mb-0.5">Transcribe Audio</h1>
            <p className="text-slate-500 text-sm">Upload an audio file and get instant text transcription</p>
          </div>
          {requestsRemaining !== null && (
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-xs">
                <span className={requestsRemaining <= 2 ? "text-amber-500 font-medium" : "text-slate-500"}>
                  {requestsRemaining}
                </span>
                <span className="text-slate-700"> / 10 left today</span>
              </p>
            </div>
          )}
        </div>

        {/* Output Language */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Output Language</label>
          <select
            value={outputLang}
            onChange={(e) => setOutputLang(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <p className="text-slate-600 text-xs mt-1">Optionally translate the transcript to another language</p>
        </div>

        {/* Drop Zone */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Audio File</label>
          <div
            onClick={() => !file && inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${dragOver ? "border-indigo-500 bg-indigo-500/10" : "border-slate-600 hover:border-slate-500"}`}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={SUPPORTED_FORMATS.map((f) => `.${f}`).join(",")}
              onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium text-sm">{file.name}</p>
                    <p className="text-slate-500 text-xs">
                      {formatBytes(file.size)}
                      {duration !== null && (
                        <span className="ml-2 text-slate-600">· {formatDuration(duration)}</span>
                      )}
                    </p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); reset(); }}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1" aria-label="Remove file">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <svg className="w-10 h-10 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-slate-300 font-medium">Drop your audio file here</p>
                <p className="text-slate-500 text-sm mt-1">or click to browse</p>
                <p className="text-slate-700 text-xs mt-2">
                  {SUPPORTED_FORMATS.join(" · ")} · max {MAX_SIZE_MB} MB
                </p>
              </>
            )}
          </div>
          {fileSizeWarning && (
            <div className="flex items-center gap-2 mt-2 text-amber-500 text-xs">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              Large file — transcription may take longer than usual.
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Transcribe Button */}
        <button
          onClick={transcribe}
          disabled={loading || !file}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
            disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed
            bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {STATUS_LABELS[status]}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Transcribe
            </>
          )}
        </button>

        {/* Translation failure warning */}
        {translationFailed && (
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-amber-400 text-sm">Translation failed — showing original transcript instead.</p>
          </div>
        )}

        {/* Transcript */}
        {transcript && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-400">Transcript</label>
              <div className="flex items-center gap-1">
                <button onClick={copyToClipboard}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-700"
                  aria-label="Copy transcript">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
                <button onClick={downloadTranscript}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-700"
                  aria-label="Download transcript">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 max-h-64 overflow-y-auto">
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{transcript}</p>
            </div>
            <p className="text-slate-700 text-xs mt-1.5 text-right">
              {wordCount.toLocaleString()} words · {charCount.toLocaleString()} characters
            </p>
          </div>
        )}
      </div>

      {/* History */}
      <div className="w-full max-w-2xl mt-2 flex flex-col items-start">
        <HistoryPanel onRestore={(text) => setTranscript(text)} newEntry={newEntry} />
      </div>

      <footer className="text-slate-700 text-xs mt-6 text-center pb-4">
        Audio processed securely via Groq · Never stored on our servers ·{" "}
        <span className="text-slate-600">© {new Date().getFullYear()} dmnstech.com</span>
        {" · "}
        <a href="/privacy" className="text-slate-600 hover:text-slate-400 underline transition-colors">
          Privacy Policy
        </a>
      </footer>
    </div>
  );
}
