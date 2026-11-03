"use client"
// Client component only because JobTags' Badge uses base-ui hooks; it is still
// fully server-rendered, so the <a href> is in the initial HTML for crawlers.

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { JobTags } from "@/components/job-board/job-tags"
import { getCategoryIcon } from "@/lib/category-icons"
import { formatHebrewDate, getJobSlug, type Category, type Job } from "@/lib/job-board-data"
import { toPreview } from "@/lib/job-text"
import { formatSalary } from "@/lib/utils"

/** Server-rendered job card that is a real link — crawlable, unlike the home page's click handler. */
export function JobListCard({ job, categories }: { job: Job; categories: Category[] }) {
  const primaryCat = categories.find((c) => job.categoryIds.includes(c.id))
  const Icon = getCategoryIcon(primaryCat?.icon ?? "briefcase")

  return (
    <Link
      href={`/jobs/${getJobSlug(job)}`}
      className="group block rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md focus-visible:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors duration-300 group-hover:bg-primary/10">
          <Icon className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base font-semibold text-foreground">{job.title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {job.company} · {job.city}
          </p>
        </div>
        <ChevronLeft className="size-5 shrink-0 text-muted-foreground/60 transition-all duration-300 group-hover:-translate-x-1 group-hover:text-primary" />
      </div>

      <div className="mt-4">
        <JobTags job={job} />
      </div>

      {job.salary && <p className="mt-2 text-xs font-medium text-primary/80">{formatSalary(job.salary)}</p>}

      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{toPreview(job.description)}</p>

      <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground/70">
        פורסם ב-{formatHebrewDate(job.postedAt)}
      </p>
    </Link>
  )
}
