import TranscriberClient from "./components/TranscriberClient";
import AdBanner from "./components/AdBanner";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col">
      <AdBanner slot={process.env.NEXT_PUBLIC_TOP_AD_SLOT_ID} className="w-full" />
      <TranscriberClient />
      <AdBanner slot={process.env.NEXT_PUBLIC_BOTTOM_AD_SLOT_ID} className="w-full" />
    </main>
  );
}
