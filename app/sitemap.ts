import type { MetadataRoute } from "next"
import { getLiveJobs } from "@/lib/get-jobs"

export const runtime = "nodejs"
// Revalidate once per hour — jobs change infrequently
export const revalidate = 3600

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobmosh.co.il"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await getLiveJobs()

  const jobUrls = jobs.filter((j) => j.status === "active").map((j) => ({
    url: `${BASE_URL}/jobs/${j.id}`,
    lastModified: new Date(j.postedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date("2026-07-05"),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date("2026-07-05"),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
    ...jobUrls,
  ]
}
