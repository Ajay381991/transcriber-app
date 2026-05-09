"use client";
import { useState, useEffect } from "react";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function HistoryPanel({ onRestore }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [open, setOpen] = useState(false);

  const fetchHistory = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem("transcription_history");
      setHistory(stored ? JSON.parse(stored) : []);
    } catch { setHistory([]); }
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchHistory();
  }, [open]);

  const deleteEntry = (id) => {
    const updated = history.filter((e) => e.id !== id);
    setHistory(updated);
    localStorage.setItem("transcription_history", JSON.stringify(updated));
    if (expanded === id) setExpanded(null);
  };

  const clearAll = () => {
    if (!confirm("Clear all history?")) return;
    setHistory([]);
    localStorage.removeItem("transcription_history");
    setExpanded(null);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm border border-slate-700 hover:border-slate-500 rounded-xl px-4 py-2.5 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        History
        {history.length > 0 && !open && (
          <span className="bg-indigo-600 text-white text-xs rounded-full px-1.5 py-0.5">{history.length}</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="w-full max-w-2xl mt-4">
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-semibold text-sm">Transcription History</h2>
              {history.length > 0 && (
                <button onClick={clearAll}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors">
                  Clear all
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="w-5 h-5 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-sm">
                No transcriptions yet
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
                {history.map((entry) => (
                  <div key={entry.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white text-sm font-medium truncate max-w-xs">
                            {entry.fileName}
                          </span>
                          <span className="text-xs bg-slate-700 text-slate-400 rounded-full px-2 py-0.5">
                            {entry.language}
                          </span>
                          <span className="text-xs text-slate-600">{timeAgo(entry.createdAt)}</span>
                        </div>
                        <p className="text-slate-500 text-xs mt-1 line-clamp-2">
                          {entry.transcript}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                          className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-700 transition-all"
                          title="View full transcript"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d={expanded === entry.id ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                          </svg>
                        </button>
                        <button
                          onClick={() => onRestore(entry.transcript)}
                          className="text-slate-500 hover:text-green-400 p-1.5 rounded-lg hover:bg-slate-700 transition-all"
                          title="Restore to editor"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 transition-all"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {expanded === entry.id && (
                      <div className="mt-3 bg-slate-900 border border-slate-700 rounded-xl p-3 max-h-48 overflow-y-auto">
                        <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                          {entry.transcript}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
