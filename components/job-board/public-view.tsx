"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty"
import { CategoryGrid } from "@/components/job-board/category-grid"
import { JobCard } from "@/components/job-board/job-card"
import { JobAlertsWidget } from "@/components/job-board/job-alerts-widget"
import { JobDrawer } from "@/components/job-board/job-drawer"
import { cn } from "@/lib/utils"
import { ArrowUp, Briefcase, Search, SearchX, X } from "lucide-react"
import { FaInstagram, FaTelegram, FaFacebook } from "react-icons/fa"

const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/mjobstlv?igsh=ZWNsb2o0OHBheDNz", icon: FaInstagram, label: "אינסטגרם", color: "hover:text-pink-400" },
  { href: "https://t.me/+SqyxSwOXhjEyMWE0", icon: FaTelegram, label: "קבוצת טלגרם", color: "hover:text-sky-400" },
  { href: "https://t.me/mjobsisrael", icon: FaTelegram, label: "ערוץ טלגרם", color: "hover:text-sky-300" },
  { href: "https://www.facebook.com/MjobsTlv", icon: FaFacebook, label: "פייסבוק", color: "hover:text-blue-400" },
]

const ALL = "all"

export function PublicView({
  jobs,
  categories,
  settings,
  onSubmitApplication,
  onSwitchToAdmin,
}: {
  jobs: Job[]
  categories: Category[]
  settings: GlobalSettings
  onSubmitApplication: (app: Application) => void
  onSwitchToAdmin: () => void
}) {
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState<string>(ALL)
  const [jobType, setJobType] = useState<string>(ALL)
  const [workModel, setWorkModel] = useState<string>(ALL)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [activeJob, setActiveJob] = useState<Job | null>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const jobsSectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const selectedCategoryName = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)?.name ?? null
    : null

  const activeJobCategoryIds = useMemo(() => {
    const ids = new Set<string>()
    jobs.filter((j) => j.status === "active").forEach((j) => j.categoryIds.forEach((id) => ids.add(id)))
    return ids
  }, [jobs])

  const activeCategories = useMemo(
    () => categories.filter((c) => activeJobCategoryIds.has(c.id)),
    [categories, activeJobCategoryIds],
  )

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

  const activeCount = jobs.filter((j) => j.status === "active").length

  return (
    <div className="pb-28">
      {/* ══════════════════════════════════
          HERO — deep forest green
          ══════════════════════════════════ */}
      <section className="relative min-h-[70vh] overflow-hidden bg-primary">
        {/* Atmospheric gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/25 via-transparent to-emerald-900/10" />

        {/* Decorative sparkle dots */}
        <div className="absolute top-20 end-16 size-2.5 rounded-full bg-amber-400/70 animate-pulse" />
        <div className="absolute top-16 end-1/3 size-1.5 rounded-full bg-white/30" />
        <div className="absolute top-40 start-20 size-3 rounded-full bg-amber-300/20 blur-sm" />
        <div className="absolute top-24 start-1/3 size-1 rounded-full bg-white/25" />
        <div className="absolute bottom-36 end-1/4 size-2 rounded-full bg-amber-400/55" />
        <div className="absolute top-56 start-1/5 size-1.5 rounded-full bg-white/20" />
        <div className="absolute bottom-28 end-1/5 size-2.5 rounded-full bg-white/10 blur-sm" />
        <div className="absolute top-32 end-1/5 size-1 rounded-full bg-amber-200/45" />
        <div className="absolute top-64 start-1/4 size-2 rounded-full bg-white/15 animate-pulse" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-8 pb-28 sm:pt-12 sm:pb-36">
          {/* Nav row */}
          <div className="mb-12 flex items-center justify-between sm:mb-16">
            <div className="flex items-center gap-2.5 group">
              <span className="flex size-10 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/25 group-hover:scale-110 group-hover:rotate-3">
                <Briefcase className="size-5 text-white transition-transform duration-300 group-hover:scale-110" />
              </span>
              <span className="font-heading text-xl font-extrabold text-white relative">
                <span className="inline-block animate-[fadeSlideIn_0.5s_ease_both]">ג&apos;וב</span>
                <span
                  className="relative inline-block text-amber-400 animate-[fadeSlideIn_0.5s_0.15s_ease_both_backwards]"
                >
                  מוש
                  {/* Animated underline glow */}
                  <span className="absolute -bottom-0.5 right-0 h-0.5 w-0 bg-amber-400/70 rounded-full transition-all duration-500 group-hover:w-full" />
                </span>
                {/* Sparkle that appears on hover */}
                <span className="absolute -top-1.5 -left-2 text-[10px] opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-y-1 select-none pointer-events-none">
                  ✦
                </span>
              </span>
            </div>
            <nav className="hidden items-center gap-6 text-sm text-white/60 sm:flex">
              {settings.navJobsVisible && (
                <button
                  onClick={() =>
                    document.getElementById("jobs-section")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="cursor-pointer transition-colors hover:text-white"
                >
                  {settings.navJobsLabel || "משרות"}
                </button>
              )}
              {settings.navCompaniesVisible && (
                <button
                  onClick={() =>
                    document.getElementById("companies-section")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="cursor-pointer transition-colors hover:text-white"
                >
                  {settings.navCompaniesLabel || "חברות"}
                </button>
              )}
              {settings.navCareersVisible && (
                <button
                  onClick={() =>
                    document.getElementById("careers-section")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="cursor-pointer transition-colors hover:text-white"
                >
                  {settings.navCareersLabel || "ייעוץ קריירה"}
                </button>
              )}
            </nav>
          </div>

          {/* Active badge */}
          <div className="mb-5 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white/80 backdrop-blur-sm">
              <span className="size-1.5 animate-pulse rounded-full bg-amber-400" />
              לוח הדרושים המושלם בישראל
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-balance text-center text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            <span className="hero-reveal inline-block" style={{ animationDelay: "0.2s" }}>
              מצאו את ה<span className="hero-word-pop text-amber-400 inline-block" style={{ animationDelay: "0.38s" }}>ג&apos;וב</span>{" "}
              <span className="whitespace-nowrap">ה<span className="relative inline-block">
                <span className="hero-word-pop-sparkle text-amber-400 inline-block" style={{ animationDelay: "0.52s" }}>מוש</span>לם
                {/* sparkle particles */}
                <span className="sparkle-dot text-[13px]" style={{ top: "-13px", right: "4px",  animationDelay: "0.8s"  }}>✦</span>
                <span className="sparkle-dot text-[8px]"  style={{ top: "-8px",  right: "-10px", animationDelay: "1.3s"  }}>✧</span>
                <span className="sparkle-dot text-[10px]" style={{ top: "-6px",  left: "-12px",  animationDelay: "1.9s"  }}>✦</span>
                <span className="sparkle-dot text-[7px]"  style={{ top: "30%",   right: "-13px", animationDelay: "0.5s"  }}>⋆</span>
                <span className="sparkle-dot text-[9px]"  style={{ bottom: "-8px", right: "8px", animationDelay: "2.1s"  }}>✦</span>
                <span className="sparkle-dot text-[7px]"  style={{ bottom: "-5px", left: "2px",  animationDelay: "1.6s"  }}>✧</span>
                <span className="sparkle-dot text-[11px]" style={{ bottom: "20%", left: "-14px", animationDelay: "2.6s"  }}>✦</span>
              </span> שלכם</span>
            </span>
            <br className="hidden sm:block" />{" "}
            <span className="hero-reveal inline-block" style={{ animationDelay: "0.48s" }}>
              במהירות
            </span>
          </h1>

          <p className="hero-reveal mx-auto mt-5 max-w-2xl text-center text-base text-white/60 sm:text-lg" style={{ animationDelay: "0.65s" }}>
            חפשו לפי תפקיד, אזור והיקף משרה ומצאו את ההזדמנות המושלמת עבורכם.
          </p>

          {/* Search */}
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 p-2 backdrop-blur-md">
              <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
                <Search className="size-4 shrink-0 text-white/45" />
                <input
                  placeholder="חיפוש לפי תפקיד, חברה או עיר..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none"
                  aria-label="חיפוש משרות"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="shrink-0 text-white/40 transition-colors hover:text-white/70"
                    aria-label="נקה חיפוש"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => jobsSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="h-11 shrink-0 rounded-xl bg-amber-500 px-5 font-semibold text-white transition-all hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.98]"
              >
                חפש משרות
              </button>
            </div>

            {/* Quick region filters */}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {REGIONS.slice(0, 5).map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(region === r ? ALL : r)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                    region === r
                      ? "border-transparent bg-white text-primary shadow-sm"
                      : "border-white/20 bg-white/10 text-white/65 hover:bg-white/20 hover:text-white",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-10 flex justify-center gap-8 sm:gap-14">
            {[
              { n: `${activeCount}+`, label: "משרות פעילות" },
              { n: `${activeCategories.length}`, label: "תחומי עיסוק" },
              { n: "100%", label: "חינמי לחלוטין" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <span className="text-2xl font-extrabold text-white sm:text-3xl">
                  {stat.n}
                </span>
                <span className="mt-1 text-xs text-white/45">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social links */}
        <div className="absolute bottom-14 sm:bottom-24 start-0 end-0 flex justify-center gap-5">
          {SOCIAL_LINKS.map(({ href, icon: Icon, label, color }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={cn("text-white/40 transition-colors duration-200", color)}
            >
              <Icon size={20} />
            </a>
          ))}
        </div>

        {/* Wave separator SVG */}
        <div className="absolute bottom-0 start-0 end-0">
          <svg
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
            className="block h-12 w-full fill-background sm:h-20"
          >
            <path d="M0,0 C360,80 1080,80 1440,0 L1440,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════
          MAIN CONTENT
          ══════════════════════════════════ */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* Filter bar */}
        <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-border pb-6">
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
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
              ניקוי סינון
            </button>
          )}
          <span className="mr-auto text-sm text-muted-foreground">
            {filtered.length} משרות נמצאו
          </span>
        </div>

        <div className="flex flex-col gap-12">
          <CategoryGrid
            categories={activeCategories}
            jobs={jobs}
            selectedId={selectedCategory}
            onSelect={setSelectedCategory}
          />

          <section id="jobs-section" ref={jobsSectionRef} aria-labelledby="jobs-heading">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2
                  id="jobs-heading"
                  className="font-heading text-xl font-bold text-foreground"
                >
                  משרות פתוחות
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filtered.length} משרות מתאימות לחיפוש שלכם
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
                    {selectedCategoryName
                      ? `לא נמצאו משרות פעילות בקטגוריית "${selectedCategoryName}". נסו קטגוריה אחרת.`
                      : "נסו להרחיב את החיפוש או לנקות את הסינון הקיים."}
                  </EmptyDescription>
                </EmptyHeader>
                <div className="flex flex-wrap justify-center gap-2">
                  {selectedCategoryName && (
                    <Button variant="outline" size="sm" onClick={() => setSelectedCategory(null)}>
                      <X data-icon="inline-start" />
                      הסר קטגוריה
                    </Button>
                  )}
                  {hasFilters && (
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      ניקוי כל הסינונים
                    </Button>
                  )}
                </div>
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

          <div id="companies-section" />
          <div id="careers-section" />

          {settings.jobAlertsEnabled && <JobAlertsWidget />}
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

      <footer className="border-t border-border py-8 text-center">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          ג&apos;וב <span className="text-amber-500">מוש</span> — לוח הדרושים המושלם בישראל
        </p>
        <div className="mb-4 flex justify-center gap-5">
          {SOCIAL_LINKS.map(({ href, icon: Icon, label, color }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={cn("text-muted-foreground/40 transition-colors duration-200", color)}
            >
              <Icon size={22} />
            </a>
          ))}
        </div>
        <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground/50">
          <a href="/terms" className="transition-colors hover:text-muted-foreground">
            תנאי שירות
          </a>
          <a href="/privacy" className="transition-colors hover:text-muted-foreground">
            מדיניות פרטיות
          </a>
          <button
            onClick={onSwitchToAdmin}
            className="transition-colors hover:text-muted-foreground/80"
          >
            כניסת מנהל
          </button>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground/30">© {new Date().getFullYear()} ג&apos;וב מוש. כל הזכויות שמורות.</p>
      </footer>

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="חזרה לראש הדף"
          className="fixed bottom-6 start-6 z-50 flex size-11 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/20 text-primary-foreground transition-all hover:bg-primary/90 hover:scale-110 active:scale-95"
        >
          <ArrowUp className="size-5" />
        </button>
      )}
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
      <SelectTrigger className="h-10 w-auto min-w-[140px]" aria-label={label}>
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
