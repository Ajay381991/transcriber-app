import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Audio Transcriber",
  description: "Privacy Policy for Audio Transcriber at transcribe.dmnstech.com",
};

export default function PrivacyPage() {
  const updated = "May 9, 2026";
  const domain = "transcribe.dmnstech.com";
  const contact = "admin@dmnstech.com";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Transcriber
        </Link>

        <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-white font-bold text-2xl mb-1">Privacy Policy</h1>
          <p className="text-slate-500 text-sm mb-8">Last updated: {updated}</p>

          <div className="space-y-6 text-slate-300 text-sm leading-relaxed">

            <section>
              <h2 className="text-white font-semibold text-base mb-2">1. Overview</h2>
              <p>
                This Privacy Policy describes how Audio Transcriber ("{domain}") collects, uses,
                and handles your information when you use our service. We are committed to protecting
                your privacy and being transparent about our practices.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">2. Information We Collect</h2>
              <p className="mb-2">We collect minimal information necessary to provide the service:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><span className="text-slate-300">Audio files</span> — uploaded by you for transcription. These are sent directly to Groq's API for processing and are <strong className="text-white">never stored</strong> on our servers.</li>
                <li><span className="text-slate-300">IP address</span> — used solely for rate limiting (max 10 requests per day) to prevent abuse. Not logged or stored permanently.</li>
                <li><span className="text-slate-300">Transcription history</span> — stored only in your browser's localStorage. We have no access to this data.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>To process your audio files and return transcription results</li>
                <li>To enforce fair usage limits (rate limiting by IP)</li>
                <li>To display relevant advertisements via Google AdSense</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">4. Third-Party Services</h2>
              <p className="mb-2">We use the following third-party services:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>
                  <span className="text-slate-300">Groq API</span> — processes your audio for transcription and translation.
                  Subject to <a href="https://groq.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">Groq's Privacy Policy</a>.
                </li>
                <li>
                  <span className="text-slate-300">Google AdSense</span> — displays advertisements. Google may use cookies to serve ads based on your prior visits.
                  Subject to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">Google's Privacy Policy</a>.
                </li>
                <li>
                  <span className="text-slate-300">Cloudflare</span> — provides CDN and DDoS protection. Subject to <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">Cloudflare's Privacy Policy</a>.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">5. Cookies</h2>
              <p>
                We do not set cookies ourselves. Google AdSense may set cookies for ad personalization.
                You can opt out of personalized ads via{" "}
                <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">
                  Google Ad Settings
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">6. Data Retention</h2>
              <p>
                Audio files are processed in real time and never stored on our servers. Transcription
                history is stored in your browser's localStorage and can be deleted at any time using
                the "Clear all" button in the History panel. IP-based rate limit counters reset every
                24 hours and are cleared when the server restarts.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">7. Children's Privacy</h2>
              <p>
                This service is not directed at children under 13. We do not knowingly collect
                personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">8. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Changes will be posted on this
                page with an updated date. Continued use of the service after changes constitutes
                acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">9. Contact</h2>
              <p>
                For privacy-related questions, contact us at{" "}
                <a href={`mailto:${contact}`} className="text-indigo-400 hover:text-indigo-300 underline">
                  {contact}
                </a>.
              </p>
            </section>

          </div>
        </div>

        <p className="text-center text-slate-700 text-xs mt-6">
          © {new Date().getFullYear()} dmnstech.com
        </p>
      </div>
    </main>
  );
}
