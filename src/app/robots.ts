import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/mypage/", "/login/", "/signup/"],
      },
    ],
    sitemap: "https://ai-video-market.vercel.app/sitemap.xml",
  }
}
