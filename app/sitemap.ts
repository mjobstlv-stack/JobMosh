import type { MetadataRoute } from "next"
import { INITIAL_JOBS } from "@/lib/job-board-data"

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobmosh.co.il"

export default function sitemap(): MetadataRoute.Sitemap {
  const jobUrls = INITIAL_JOBS.filter((j) => j.status === "active").map(
    (j) => ({
      url: `${BASE_URL}/jobs/${j.id}`,
      lastModified: new Date(j.postedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }),
  )

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    ...jobUrls,
  ]
}
