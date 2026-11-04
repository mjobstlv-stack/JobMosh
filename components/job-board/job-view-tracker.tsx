"use client"

import { useEffect } from "react"
import { jobParams, registerCategories, trackEvent, type AnalyticsJob } from "@/lib/analytics"
import type { Category } from "@/lib/job-board-data"

/**
 * Sends job_view with the full recruitment dimensions when a /jobs/[id] page opens,
 * so job pages and the homepage drawer land in the same report (split by view_source).
 */
export function JobViewTracker({ job, categories }: { job: AnalyticsJob; categories: Category[] }) {
  useEffect(() => {
    registerCategories(categories)
    trackEvent("job_view", { ...jobParams(job), view_source: "job_page" })
  }, [job, categories])

  return null
}
