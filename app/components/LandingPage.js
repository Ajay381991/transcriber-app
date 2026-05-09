"use client";
import { signIn } from "next-auth/react";
import AdBanner from "./AdBanner";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col">
      {/* Top Ad */}
      <AdBanner slot="TOP_AD_SLOT_ID" className="w-full" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-600 mb-6 shadow-2xl shadow-indigo-500/40">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Audio Transcriber
          </h1>
          <p className="text-xl text-slate-400 mb-2">
            Convert any audio file to text — instantly & free
          </p>
          <p className="text-sm text-slate-500">
            Powered by Groq Whisper AI · 99 languages · No credit card needed
          </p>
        </div>

        {/* Sign-in Card */}
        <div className="w-full max-w-sm bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
          <h2 className="text-white font-semibold text-lg mb-2">Get Started Free</h2>
          <p className="text-slate-400 text-sm mb-6">
            Sign in with your Google account to start transcribing
          </p>
          <button
            onClick={() => signIn("google", { callbackUrl: `${window.location.origin}/transcribe` })}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <p className="text-slate-600 text-xs mt-4">
            Free to use · No spam · Unsubscribe anytime
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-12 w-full">
          {[
            { icon: "⚡", title: "Lightning Fast", desc: "Groq's LPU delivers results in seconds" },
            { icon: "🌍", title: "99 Languages", desc: "Auto-detects language — no config needed" },
            { icon: "🔒", title: "Private & Secure", desc: "Audio processed server-side, never stored" },
          ].map((f) => (
            <div key={f.title} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 text-center">
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="text-white font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-slate-500 text-xs">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Ad */}
      <AdBanner slot="BOTTOM_AD_SLOT_ID" className="w-full" />

      <footer className="text-center text-slate-700 text-xs py-4">
        © {new Date().getFullYear()} Audio Transcriber · Free forever
      </footer>
    </main>
  );
}
