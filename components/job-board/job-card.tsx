"use client"

import { Card } from "@/components/ui/card"
import { JobTags } from "@/components/job-board/job-tags"
import { getCategoryIcon } from "@/lib/category-icons"
import { cn, formatSalary } from "@/lib/utils"
import { formatHebrewDate, type Category, type Job } from "@/lib/job-board-data"
import Link from "next/link"
import { ChevronLeft, ExternalLink, MessageCircle, Send } from "lucide-react"

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

  function handleWhatsApp(e: React.MouseEvent) {
    e.stopPropagation()
    const text = `היי, אני מעוניין/ת להגיש מועמדות למשרת ${job.title} באזור ${job.region} שפורסמה בג'וב מוש. אשמח לפרטים נוספים.`
    window.open(
      `https://wa.me/${job.whatsappNumber}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    )
  }

  function handleSiteApply(e: React.MouseEvent) {
    e.stopPropagation()
    onClick()
  }

  const hasApply = job.allowSiteApply || job.allowWhatsApp

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
      className="group cursor-pointer gap-0 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:scale-[1.01] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
    >
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors duration-300 group-hover:bg-primary/10">
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
        <ChevronLeft className="size-5 shrink-0 text-muted-foreground/60 transition-all duration-300 group-hover:-translate-x-1 group-hover:text-primary" />
      </div>

      <div className="mt-4">
        <JobTags job={job} />
      </div>

      {job.salary && (
        <p className="mt-2 text-xs font-medium text-primary/80">
          {formatSalary(job.salary)}
        </p>
      )}

      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {job.description}
      </p>

      {/* Footer: date + share + apply buttons */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground/60">
            פורסם ב{formatHebrewDate(job.postedAt)}
          </p>
          <Link
            href={`/jobs/${job.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-muted-foreground/50 transition-colors hover:text-primary"
            aria-label="דף המשרה"
            title="קישור ישיר למשרה"
          >
            <ExternalLink className="size-3" />
          </Link>
        </div>

        {hasApply && (
          <div className="flex items-center gap-2 shrink-0">
            {job.allowWhatsApp && (
              <button
                onClick={handleWhatsApp}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-all hover:bg-green-100 hover:border-green-300",
                )}
                aria-label="הגשה מהירה בוואטסאפ"
              >
                <MessageCircle className="size-3.5" />
                <span>WhatsApp</span>
              </button>
            )}
            {job.allowSiteApply && (
              <button
                onClick={handleSiteApply}
                className="flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20 hover:border-primary/40"
                aria-label="הגשת מועמדות באתר"
              >
                <Send className="size-3.5" />
                <span>הגשה</span>
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
