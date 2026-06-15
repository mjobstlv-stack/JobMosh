"use client"

import { Card } from "@/components/ui/card"
import { JobTags } from "@/components/job-board/job-tags"
import { getCategoryIcon } from "@/lib/category-icons"
import { formatHebrewDate, type Category, type Job } from "@/lib/job-board-data"
import { ChevronLeft } from "lucide-react"

export function JobCard({
  job,
  categories,
  onClick,
}: {
  job: Job
  categories: Category[]
  onClick: () => void
}) {
  const primaryCat = categories.find((c) => job.categoryIds.includes(c.id))
  const Icon = getCategoryIcon(primaryCat?.icon ?? "briefcase")

  return (
    <Card
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className="group cursor-pointer gap-0 p-5 transition-all hover:border-primary/40 hover:shadow-md focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
    >
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-base font-semibold text-foreground">
            {job.title}
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {job.company} · {job.city}
          </p>
        </div>
        <ChevronLeft className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1 group-hover:text-primary" />
      </div>

      <div className="mt-4">
        <JobTags job={job} />
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {job.description}
      </p>

      <p className="mt-4 text-xs text-muted-foreground">
        פורסם ב{formatHebrewDate(job.postedAt)}
      </p>
    </Card>
  )
}
