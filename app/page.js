import TranscriberClient from "./components/TranscriberClient";
import AdBanner from "./components/AdBanner";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Audio Transcriber",
  "url": "https://transcribe.dmnstech.com",
  "description": "Free AI-powered audio transcription tool. Convert speech to text in 99 languages using Groq Whisper AI. No sign-in required.",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "Audio to text transcription",
    "Supports 99 languages",
    "Translation to 25+ languages",
    "MP3, WAV, M4A, FLAC support",
    "No sign-in required",
    "Free to use"
  ],
  "provider": {
    "@type": "Organization",
    "name": "dmnstech",
    "url": "https://dmnstech.com"
  }
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col">
        <AdBanner slot={process.env.NEXT_PUBLIC_TOP_AD_SLOT_ID} className="w-full" />
        <TranscriberClient />
        <AdBanner slot={process.env.NEXT_PUBLIC_BOTTOM_AD_SLOT_ID} className="w-full" />
      </main>
    </>
  );
}
