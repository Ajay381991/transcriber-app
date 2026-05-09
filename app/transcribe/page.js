import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TranscriberClient from "../components/TranscriberClient";
import AdBanner from "../components/AdBanner";

export default async function TranscribePage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col">
      <AdBanner slot="TOP_AD_SLOT_ID" className="w-full" />
      <TranscriberClient user={session.user} />
      <AdBanner slot="BOTTOM_AD_SLOT_ID" className="w-full" />
    </main>
  );
}
