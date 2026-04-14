import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/mypage/", "/login/", "/signup/", "/dashboard/", "/admin/", "/settings/", "/messages/", "/notifications/", "/history/", "/favorites/", "/order/", "/auth/"],
      },
    ],
    sitemap: "https://ttukddak.vercel.app/sitemap.xml",
  }
}
