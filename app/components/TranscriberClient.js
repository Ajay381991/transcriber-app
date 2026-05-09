"use client";
import { useState, useRef, useCallback } from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import HistoryPanel from "./HistoryPanel";

const SUPPORTED_FORMATS = ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm", "ogg", "flac"];
const MAX_SIZE_MB = 25;

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

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function TranscriberClient({ user }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [outputLang, setOutputLang] = useState("original");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  const validateFile = (f) => {
    const ext = f.name.split(".").pop().toLowerCase();
    if (!SUPPORTED_FORMATS.includes(ext))
      return `Unsupported format ".${ext}". Supported: ${SUPPORTED_FORMATS.join(", ")}`;
    if (f.size > MAX_SIZE_MB * 1024 * 1024)
      return `File too large (${formatBytes(f.size)}). Max is ${MAX_SIZE_MB} MB.`;
    return null;
  };

  const handleFile = useCallback((f) => {
    setError(""); setTranscript("");
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setFile(f);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const transcribe = async () => {
    if (!file) return;
    setError(""); setTranscript(""); setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (outputLang !== "original") fd.append("outputLang", outputLang);
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Transcription failed");
      setTranscript(data.text);
      try {
        const entry = { ...data.meta, transcript: data.text };
        const stored = localStorage.getItem("transcription_history");
        const history = stored ? JSON.parse(stored) : [];
        history.unshift(entry);
        localStorage.setItem("transcription_history", JSON.stringify(history.slice(0, 50)));
      } catch {}
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null); setTranscript(""); setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcript).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
        <div className="flex items-center gap-3">
          {user.image && (
            <Image
              src={user.image}
              alt={user.name}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <span className="text-slate-400 text-sm hidden sm:block">{user.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-slate-500 hover:text-slate-300 text-xs border border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5">
        <div>
          <h1 className="text-white font-bold text-xl mb-0.5">Transcribe Audio</h1>
          <p className="text-slate-500 text-sm">Upload an audio file and get instant text transcription</p>
        </div>

        {/* Output Language Selector */}
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
          <p className="text-slate-600 text-xs mt-1">Translate the transcript to your preferred language</p>
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
                    <p className="text-slate-500 text-xs">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); reset(); }}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1">
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

        {/* Button */}
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
              Transcribing...
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

        {/* Transcript */}
        {transcript && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-400">Transcript</label>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-700"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 max-h-64 overflow-y-auto">
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{transcript}</p>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="w-full max-w-2xl mt-2 flex flex-col items-start">
        <HistoryPanel onRestore={(text) => setTranscript(text)} />
      </div>

      <p className="text-slate-700 text-xs mt-4">
        Audio processed securely via Groq · Never stored
      </p>
    </div>
  );
}
