"use client";
import { useEffect } from "react";

export default function AdBanner({ slot, className = "" }) {
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch {}
  }, []);

  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) {
    return (
      <div className={`flex items-center justify-center bg-slate-900/40 border-y border-slate-800 text-slate-700 text-xs py-2 ${className}`}>
        Ad space — configure NEXT_PUBLIC_ADSENSE_CLIENT_ID to enable
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
