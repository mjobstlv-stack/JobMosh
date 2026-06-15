"use client"

import { useMemo, useState } from "react"
import {
  REGIONS,
  JOB_TYPES,
  WORK_MODELS,
  type Application,
  type Category,
  type GlobalSettings,
  type Job,
} from "@/lib/job-board-data"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty"
import { CategoryGrid } from "@/components/job-board/category-grid"
import { JobCard } from "@/components/job-board/job-card"
import { JobAlertsWidget } from "@/components/job-board/job-alerts-widget"
import { JobDrawer } from "@/components/job-board/job-drawer"
import { Briefcase, Search, SearchX, X } from "lucide-react"

const ALL = "all"

export function PublicView({
  jobs,
  categories,
  settings,
  onSubmitApplication,
}: {
  jobs: Job[]
  categories: Category[]
  settings: GlobalSettings
  onSubmitApplication: (app: Application) => void
}) {
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState<string>(ALL)
  const [jobType, setJobType] = useState<string>(ALL)
  const [workModel, setWorkModel] = useState<string>(ALL)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [activeJob, setActiveJob] = useState<Job | null>(null)

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      if (job.status !== "active") return false
      if (selectedCategory && !job.categoryIds.includes(selectedCategory))
        return false
      if (region !== ALL && job.region !== region) return false
      if (jobType !== ALL && job.jobType !== jobType) return false
      if (workModel !== ALL && job.workModel !== workModel) return false
      if (query.trim()) {
        const q = query.trim().toLowerCase()
        const haystack = `${job.title} ${job.company} ${job.city}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [jobs, selectedCategory, region, jobType, workModel, query])

  const hasFilters =
    query.trim() !== "" ||
    region !== ALL ||
    jobType !== ALL ||
    workModel !== ALL ||
    selectedCategory !== null

  function resetFilters() {
    setQuery("")
    setRegion(ALL)
    setJobType(ALL)
    setWorkModel(ALL)
    setSelectedCategory(null)
  }

  return (
    <div className="pb-28">
      {/* Top bar */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Briefcase className="size-5" />
            </span>
            <span className="font-heading text-lg font-bold text-foreground">
              דרושים<span className="text-primary">פלוס</span>
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <span className="cursor-pointer transition-colors hover:text-foreground">משרות</span>
            <span className="cursor-pointer transition-colors hover:text-foreground">חברות</span>
            <span className="cursor-pointer transition-colors hover:text-foreground">ייעוץ קריירה</span>
          </nav>
        </div>
      </header>

      {/* Hero & search */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-accent/40 to-background">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance font-heading text-3xl font-extrabold leading-tight text-foreground sm:text-5xl">
              המשרה הבאה שלכם <span className="text-primary">מתחילה כאן</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              אלפי משרות מחברות מובילות בישראל. חפשו לפי תפקיד, אזור והיקף משרה
              ומצאו את ההזדמנות המושלמת עבורכם.
            </p>
          </div>

          {/* Search panel */}
          <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-border bg-card p-4 shadow-lg ring-1 ring-foreground/5 sm:p-5">
            <InputGroup className="h-12 bg-background">
              <InputGroupInput
                placeholder="חיפוש לפי תפקיד, חברה או עיר..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="חיפוש משרות"
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FilterSelect
                label="אזור"
                value={region}
                onChange={setRegion}
                options={REGIONS}
                allLabel="כל האזורים"
              />
              <FilterSelect
                label="היקף משרה"
                value={jobType}
                onChange={setJobType}
                options={JOB_TYPES}
                allLabel="כל ההיקפים"
              />
              <FilterSelect
                label="מודל עבודה"
                value={workModel}
                onChange={setWorkModel}
                options={WORK_MODELS}
                allLabel="כל המודלים"
              />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-12">
          <CategoryGrid
            categories={categories}
            jobs={jobs}
            selectedId={selectedCategory}
            onSelect={setSelectedCategory}
          />

          {settings.jobAlertsEnabled && <JobAlertsWidget />}

          <section aria-labelledby="jobs-heading">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2
                  id="jobs-heading"
                  className="font-heading text-xl font-bold text-foreground"
                >
                  משרות פתוחות
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  נמצאו {filtered.length} משרות מתאימות
                </p>
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X data-icon="inline-start" />
                  ניקוי סינון
                </Button>
              )}
            </div>

            {filtered.length === 0 ? (
              <Empty className="border bg-card py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SearchX />
                  </EmptyMedia>
                  <EmptyTitle>לא נמצאו משרות</EmptyTitle>
                  <EmptyDescription>
                    נסו להרחיב את החיפוש או לנקות את הסינון הקיים.
                  </EmptyDescription>
                </EmptyHeader>
                {hasFilters && (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    ניקוי כל הסינונים
                  </Button>
                )}
              </Empty>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filtered.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    categories={categories}
                    onClick={() => setActiveJob(job)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <JobDrawer
        job={activeJob}
        categories={categories}
        onOpenChange={(open) => {
          if (!open) setActiveJob(null)
        }}
        onSubmitApplication={onSubmitApplication}
      />
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: readonly string[]
  allLabel: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as string)}>
      <SelectTrigger className="h-11 w-full" aria-label={label}>
        <SelectValue placeholder={label}>
          {(val) => (val === ALL ? allLabel : (val as string))}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
