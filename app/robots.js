export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: "https://transcribe.dmnstech.com/sitemap.xml",
  };
}
