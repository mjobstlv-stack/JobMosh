import type { MetadataRoute } from "next"
import { getLiveCategories, getLiveJobs } from "@/lib/get-jobs"
import { MIN_JOBS_TO_INDEX, categoryUrl, cityUrl, getCategoryPages, getCityPages } from "@/lib/landing-pages"
import { getJobSlug } from "@/lib/job-board-data"

export const runtime = "nodejs"
// Revalidate every 10 minutes so new jobs and landing pages appear quickly
export const revalidate = 600

import { SITE_URL as BASE_URL } from "@/lib/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobs, categories] = await Promise.all([getLiveJobs(), getLiveCategories()])

  const jobUrls = jobs.filter((j) => j.status === "active").map((j) => ({
    url: `${BASE_URL}/jobs/${getJobSlug(j)}`,
    lastModified: new Date(j.postedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  // Landing pages with enough jobs to be worth indexing (thin ones are noindex).
  const newest = (list: { postedAt: string }[]) => new Date(list[0]?.postedAt ?? Date.now())
  const landingUrls = [
    ...getCityPages(jobs).filter((p) => p.jobs.length >= MIN_JOBS_TO_INDEX).map((p) => ({ path: cityUrl(p.slug), jobs: p.jobs })),
    ...getCategoryPages(jobs, categories).filter((p) => p.jobs.length >= MIN_JOBS_TO_INDEX).map((p) => ({ path: categoryUrl(p.slug), jobs: p.jobs })),
  ].map(({ path, jobs: list }) => ({
    url: `${BASE_URL}${encodeURI(path)}`,
    lastModified: newest(list),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date("2026-07-10"),
      changeFrequency: "yearly" as const,
      priority: 0.4,
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
    {
      url: `${BASE_URL}/accessibility`,
      lastModified: new Date("2026-07-10"),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/jobs`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    ...landingUrls,
    ...jobUrls,
  ]
}
