import type { MetadataRoute } from "next"
import { getCategories, getServices, getExperts } from "@/lib/db-server"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://ttukddak.vercel.app"

  const [categories, services, expertsResult] = await Promise.all([
    getCategories(),
    getServices(),
    getExperts(50),
  ])
  const experts = expertsResult.experts

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/guide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ]

  // 카테고리 페이지
  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  // 서비스 페이지 (상위 100개만)
  const servicePages: MetadataRoute.Sitemap = services.slice(0, 100).map((service) => ({
    url: `${baseUrl}/service/${service.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  // 전문가 페이지 (상위 50개만)
  const expertPages: MetadataRoute.Sitemap = experts.slice(0, 50).map((expert) => ({
    url: `${baseUrl}/expert/${expert.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  return [...staticPages, ...categoryPages, ...servicePages, ...expertPages]
}
