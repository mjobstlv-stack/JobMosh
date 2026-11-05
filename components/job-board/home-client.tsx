"use client"

import { useEffect, useState } from "react"
import {
  type Category,
  type Job,
  type Application,
  type GlobalSettings,
} from "@/lib/job-board-data"
import { PublicView } from "@/components/job-board/public-view"

/**
 * Client shell for the public home page. Jobs/categories/settings arrive
 * server-rendered as props (so search engines see the real listings in the
 * initial HTML) and jobs/categories are refreshed from the API on mount.
 * The admin panel lives on its own host (ADMIN_HOST) — see app/panel.
 */
export function HomeClient({
  initialJobs,
  initialCategories,
  initialSettings,
}: {
  initialJobs: Job[]
  initialCategories: Category[]
  initialSettings: GlobalSettings
}) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [categories, setCategories] = useState<Category[]>(initialCategories)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [jobsRes, catsRes] = await Promise.all([
        fetch("/api/jobs").catch(() => null),
        fetch("/api/categories").catch(() => null),
      ])
      if (cancelled) return
      if (jobsRes?.ok) {
        const data = await jobsRes.json().catch(() => null)
        if (!cancelled && Array.isArray(data) && data.length > 0) setJobs(data)
      }
      if (catsRes?.ok) {
        const data = await catsRes.json().catch(() => null)
        if (!cancelled && Array.isArray(data) && data.length > 0) setCategories(data)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <PublicView
        jobs={jobs}
        categories={categories}
        settings={initialSettings}
        onSubmitApplication={(_app: Application) => {}}
      />
    </div>
  )
}
