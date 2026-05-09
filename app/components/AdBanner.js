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

  // Render nothing if AdSense client ID or slot ID is not configured
  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || !slot) {
    return null;
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
