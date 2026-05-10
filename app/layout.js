import { Geist } from "next/font/google";
import Script from "next/script";
import Providers from "./providers";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata = {
  title: "Free Audio Transcriber — AI Speech to Text in 99 Languages",
  description:
    "Transcribe any audio file to text instantly using Groq Whisper AI. Supports MP3, WAV, M4A and more. Free, no sign-in required. Translate to 25+ languages.",
  keywords: "audio transcriber, speech to text, free transcription, whisper AI, audio to text, voice to text, transcribe MP3, transcribe WAV, AI transcription",
  authors: [{ name: "dmnstech" }],
  creator: "dmnstech",
  metadataBase: new URL("https://transcribe.dmnstech.com"),
  alternates: {
    canonical: "https://transcribe.dmnstech.com",
  },
  openGraph: {
    title: "Free Audio Transcriber — AI Speech to Text in 99 Languages",
    description: "Transcribe any audio file to text instantly using Groq Whisper AI. Free, no sign-in required.",
    url: "https://transcribe.dmnstech.com",
    siteName: "Audio Transcriber",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Audio Transcriber — AI Speech to Text",
    description: "Transcribe any audio file to text instantly using Groq Whisper AI. Free, no sign-in required.",
    creator: "@dmnstech",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-JW674335DB" />
        <script dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-JW674335DB');`
        }} />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 font-sans antialiased">
        <Providers>{children}</Providers>
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
