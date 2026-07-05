# JobMosh Warm Editorial Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform JobMosh from a cold blue/purple palette to a warm earthy editorial aesthetic, add mobile-first UX patterns (bottom sheet drawer, swipeable category carousel, sticky apply bar), and fix two existing TypeScript bugs.

**Architecture:** Targeted enhancement — 8 file changes, zero new packages, zero new routes. CSS custom properties are updated first as the shared foundation, then each component is upgraded independently. All existing business logic, data types, and UI component primitives (`components/ui/`) remain unchanged.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Shadcn Sheet (supports `side="bottom"`), Lucide React, OKLCH color space for all palette values.

---

## File Map

| File | Change |
|---|---|
| `app/globals.css` | Replace `:root` color tokens + `--radius` |
| `components/job-board/category-grid.tsx` | Mobile horizontal scroll carousel + visual polish |
| `components/job-board/job-drawer.tsx` | `useIsMobile` hook, `side` toggle, sticky apply bar |
| `components/job-board/job-card.tsx` | `rounded-2xl`, shadow, hover scale |
| `components/job-board/public-view.tsx` | Sticky header, hero gradient + blob, pill badge |
| `components/job-board/job-alerts-widget.tsx` | `rounded-2xl`, decorative blob, contrast fix |
| `components/job-board/admin-view.tsx` | Remove `j.views` bug, pass `setJobs` to CategoriesTab |

---

### Task 1: CSS Palette — Warm Editorial Colors

**Files:**
- Modify: `app/globals.css` (`:root` block, lines 53–89)

- [ ] **Step 1: Replace the `:root` color block**

Open `app/globals.css`. Replace the entire `:root { ... }` block with:

```css
:root {
  color-scheme: light;
  --background: oklch(0.982 0.004 80);
  --foreground: oklch(0.18 0.012 45);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.18 0.012 45);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0.012 45);
  --primary: oklch(0.22 0.07 145);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.955 0.006 80);
  --secondary-foreground: oklch(0.25 0.012 45);
  --muted: oklch(0.955 0.006 80);
  --muted-foreground: oklch(0.50 0.015 60);
  --accent: oklch(0.93 0.04 145);
  --accent-foreground: oklch(0.22 0.07 145);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.91 0.008 60);
  --input: oklch(0.91 0.008 60);
  --ring: oklch(0.22 0.07 145);
  --chart-1: oklch(0.22 0.07 145);
  --chart-2: oklch(0.40 0.09 145);
  --chart-3: oklch(0.65 0.14 60);
  --chart-4: oklch(0.55 0.12 80);
  --chart-5: oklch(0.72 0.15 60);
  --radius: 1rem;
  --whatsapp: oklch(0.66 0.16 152);
  --whatsapp-foreground: oklch(0.985 0 0);
  --sidebar: oklch(0.982 0.004 80);
  --sidebar-foreground: oklch(0.18 0.012 45);
  --sidebar-primary: oklch(0.22 0.07 145);
  --sidebar-primary-foreground: oklch(0.98 0 0);
  --sidebar-accent: oklch(0.93 0.04 145);
  --sidebar-accent-foreground: oklch(0.22 0.07 145);
  --sidebar-border: oklch(0.91 0.008 60);
  --sidebar-ring: oklch(0.22 0.07 145);
}
```

- [ ] **Step 2: Verify in browser**

Dev server runs at http://localhost:3000 (`npm run dev` if not already running).

Expected: The entire site shifts — buttons are deep forest green, category tags use sage green, background is warm off-white, text is charcoal. No purple/blue anywhere.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: switch to warm editorial palette (forest green + earthy tones)"
```

---

### Task 2: CategoryGrid — Mobile Swipeable Carousel

**Files:**
- Modify: `components/job-board/category-grid.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
"use client"

import { cn } from "@/lib/utils"
import { getCategoryIcon } from "@/lib/category-icons"
import type { Category, Job } from "@/lib/job-board-data"
import { LayoutGrid } from "lucide-react"

export function CategoryGrid({
  categories,
  jobs,
  selectedId,
  onSelect,
}: {
  categories: Category[]
  jobs: Job[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const countFor = (catId: string) =>
    jobs.filter(
      (j) => j.status === "active" && j.categoryIds.includes(catId),
    ).length

  const activeTotal = jobs.filter((j) => j.status === "active").length

  return (
    <section aria-labelledby="categories-heading">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2
            id="categories-heading"
            className="font-heading text-xl font-bold text-foreground"
          >
            עיון לפי תחום
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            בחרו קטגוריה כדי לסנן את המשרות
          </p>
        </div>
      </div>

      {/*
        Mobile: horizontal scroll carousel (flex, overflow-x-auto, snap).
        Desktop (sm+): reverts to CSS grid via sm: overrides.
      */}
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-4 xl:grid-cols-5">
        <CategoryCard
          label="כל המשרות"
          count={activeTotal}
          active={selectedId === null}
          onClick={() => onSelect(null)}
          icon={<LayoutGrid className="size-6" />}
        />
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.icon)
          return (
            <CategoryCard
              key={cat.id}
              label={cat.name}
              count={countFor(cat.id)}
              active={selectedId === cat.id}
              onClick={() => onSelect(cat.id)}
              icon={<Icon className="size-6" />}
            />
          )
        })}
      </div>
    </section>
  )
}

function CategoryCard({
  label,
  count,
  active,
  onClick,
  icon,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-col items-start gap-3 rounded-2xl border p-4 text-right transition-all duration-300",
        "snap-start shrink-0 w-[140px] min-h-[120px]",
        "sm:w-auto sm:shrink",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-md"
          : "border-border bg-card text-foreground hover:border-primary/30 hover:shadow-md hover:scale-[1.02]",
      )}
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-xl transition-colors",
          active
            ? "bg-primary-foreground/15"
            : "bg-accent text-accent-foreground",
        )}
      >
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-semibold leading-tight">{label}</span>
        <span
          className={cn(
            "mt-0.5 text-xs",
            active ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {count} משרות
        </span>
      </span>
    </button>
  )
}
```

- [ ] **Step 2: Verify mobile carousel**

In Chrome DevTools → Toggle device toolbar → select iPhone 14 (390px width). Open http://localhost:3000.

Expected:
- Categories appear as a single horizontal row of cards (140px wide each)
- Swiping left/right scrolls through them smoothly
- No horizontal scrollbar visible
- Cards snap cleanly between positions

At ≥640px desktop width: cards revert to a CSS grid (3–5 columns), no horizontal scrolling.

- [ ] **Step 3: Commit**

```bash
git add components/job-board/category-grid.tsx
git commit -m "feat: swipeable category carousel on mobile, grid on desktop"
```

---

### Task 3: JobDrawer — Bottom Sheet on Mobile + Sticky Apply Bar

**Files:**
- Modify: `components/job-board/job-drawer.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { JobTags } from "@/components/job-board/job-tags"
import { ApplyFormDialog } from "@/components/job-board/apply-form-dialog"
import { getCategoryIcon } from "@/lib/category-icons"
import { cn } from "@/lib/utils"
import {
  formatHebrewDate,
  type Application,
  type Category,
  type Job,
} from "@/lib/job-board-data"
import {
  CheckCircle2,
  FileText,
  MapPin,
  MessageCircle,
  Send,
} from "lucide-react"

/** Returns true when the viewport is narrower than Tailwind's `sm` breakpoint (640px). SSR-safe: starts false. */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return isMobile
}

export function JobDrawer({
  job,
  categories,
  onOpenChange,
  onSubmitApplication,
}: {
  job: Job | null
  categories: Category[]
  onOpenChange: (open: boolean) => void
  onSubmitApplication: (app: Application) => void
}) {
  const [applyOpen, setApplyOpen] = useState(false)
  const isMobile = useIsMobile()

  function handleWhatsApp() {
    if (!job) return
    const template = `היי, אני מעוניין/ת להגיש מועמדות למשרת ${job.title} באזור ${job.region} שפורסמה באתר שלך. אשמח לקבל פרטים נוספים.`
    const url = `https://wa.me/${job.whatsappNumber}?text=${encodeURIComponent(template)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const jobCats = job
    ? categories.filter((c) => job.categoryIds.includes(c.id))
    : []

  return (
    <>
      <Sheet open={!!job} onOpenChange={onOpenChange}>
        <SheetContent
          side={isMobile ? "bottom" : "left"}
          className={cn(
            "gap-0 p-0 flex flex-col",
            isMobile
              ? "w-full rounded-t-3xl max-h-[92dvh]"
              : "sm:max-w-lg",
          )}
        >
          {job && (
            <>
              {/* Drag handle — visible on mobile only */}
              {isMobile && (
                <div className="mx-auto mt-3 mb-1 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
              )}

              <SheetHeader className="border-b border-border p-5 shrink-0">
                <div className="flex items-start gap-4">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                    {(() => {
                      const Icon = getCategoryIcon(
                        jobCats[0]?.icon ?? "briefcase",
                      )
                      return <Icon className="size-7" />
                    })()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-xl leading-tight">
                      {job.title}
                    </SheetTitle>
                    <SheetDescription className="mt-1 flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {job.company} · {job.city}
                    </SheetDescription>
                  </div>
                </div>
                <div className="mt-4">
                  <JobTags job={job} />
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1 min-h-0">
                <div className="flex flex-col gap-6 p-5">
                  <section>
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                      תיאור המשרה
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {job.description}
                    </p>
                  </section>

                  <section>
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                      דרישות התפקיד
                    </h3>
                    <ul className="mt-3 flex flex-col gap-2">
                      {job.requirements.map((req, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  {jobCats.length > 0 && (
                    <section>
                      <h3 className="font-heading text-sm font-semibold text-foreground">
                        תחומים
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {jobCats.map((c) => (
                          <Badge key={c.id} variant="outline">
                            {c.name}
                          </Badge>
                        ))}
                      </div>
                    </section>
                  )}

                  <p className="text-xs text-muted-foreground">
                    פורסם ב{formatHebrewDate(job.postedAt)}
                  </p>
                </div>
              </ScrollArea>

              {/* Sticky apply bar — always visible at bottom, thumb-reachable */}
              <div className="sticky bottom-0 shrink-0 border-t border-border bg-card/95 backdrop-blur-sm p-4 z-10">
                {job.allowSiteApply || job.allowWhatsApp ? (
                  <div className="flex flex-col gap-2">
                    {job.allowSiteApply && (
                      <Button
                        className="h-12 w-full"
                        size="lg"
                        onClick={() => setApplyOpen(true)}
                      >
                        <Send data-icon="inline-start" />
                        הגש מועמדות באתר
                      </Button>
                    )}
                    {job.allowWhatsApp && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleWhatsApp}
                        className="h-12 w-full border-whatsapp/30 bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90 hover:text-whatsapp-foreground"
                      >
                        <MessageCircle data-icon="inline-start" />
                        הגשה מהירה בוואטסאפ
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                    <FileText className="size-4" />
                    הגשת מועמדות לתפקיד זה אינה זמינה כרגע.
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {job && (
        <ApplyFormDialog
          job={job}
          open={applyOpen}
          onOpenChange={setApplyOpen}
          onSubmitApplication={onSubmitApplication}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Verify bottom sheet on mobile (375px)**

Switch DevTools to iPhone SE (375px).
- Click any job card.

Expected:
- Sheet slides UP from the bottom of the screen
- Top corners are visibly rounded (`rounded-t-3xl`)
- Gray drag handle bar appears at the very top of the sheet
- Job description scrollable in the middle
- "הגש מועמדות באתר" and/or "הגשה מהירה בוואטסאפ" buttons are always visible at the bottom, never need scrolling to reach (h-12 = 48px touch targets)

At desktop (≥640px): sheet slides in from the side — unchanged.

- [ ] **Step 3: Commit**

```bash
git add components/job-board/job-drawer.tsx
git commit -m "feat: mobile bottom sheet drawer, sticky apply bar with 48px touch targets"
```

---

### Task 4: JobCard — Visual Polish

**Files:**
- Modify: `components/job-board/job-card.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
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

      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {job.description}
      </p>

      <p className="mt-4 text-xs text-muted-foreground/70">
        פורסם ב{formatHebrewDate(job.postedAt)}
      </p>
    </Card>
  )
}
```

- [ ] **Step 2: Verify**

Open http://localhost:3000 at desktop width.

Expected:
- Cards have clearly rounded corners (`rounded-2xl`)
- A soft shadow (`shadow-sm`) is visible under each card
- Hovering a card: subtle scale up + deeper shadow + green left border tint
- Icon area shifts from sage to a faint green on hover
- Chevron slides slightly left on hover and turns primary green

- [ ] **Step 3: Commit**

```bash
git add components/job-board/job-card.tsx
git commit -m "style: job cards — rounded-2xl, shadow, hover scale + border tint"
```

---

### Task 5: Hero Section + Sticky Header

**Files:**
- Modify: `components/job-board/public-view.tsx`

- [ ] **Step 1: Replace the `<header>` block**

In `public-view.tsx`, find the `{/* Top bar */}` comment section. Replace the entire `<header>...</header>` block with:

```tsx
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Briefcase className="size-5" />
            </span>
            <span className="font-heading text-lg font-bold text-foreground">
              ג'וב<span className="text-primary">מוש</span>
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <span className="cursor-pointer transition-colors hover:text-foreground">משרות</span>
            <span className="cursor-pointer transition-colors hover:text-foreground">חברות</span>
            <span className="cursor-pointer transition-colors hover:text-foreground">ייעוץ קריירה</span>
          </nav>
        </div>
      </header>
```

- [ ] **Step 2: Replace the hero `<section>` block**

Find the `{/* Hero & search */}` comment. Replace from `<section className="relative overflow-hidden ...">` through its closing `</section>` with:

```tsx
      {/* Hero & search */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-accent/50 via-accent/20 to-background">
        {/* Decorative background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/8 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <span className="size-1.5 rounded-full bg-primary" />
              אלפי משרות מחברות מובילות בישראל
            </div>
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
```

- [ ] **Step 3: Verify hero**

Open http://localhost:3000.

Expected:
- Header sticks to the top when scrolling (test by scrolling down the job feed)
- Header has a frosted glass effect (`backdrop-blur-md bg-card/80`)
- Hero section shows sage-green gradient fading to warm off-white
- A large soft green glow blob sits behind the hero text
- A small pill badge ("אלפי משרות...") appears above the heading

- [ ] **Step 4: Commit**

```bash
git add components/job-board/public-view.tsx
git commit -m "style: sticky frosted header, hero gradient blob + pill badge"
```

---

### Task 6: JobAlertsWidget — Polish

**Files:**
- Modify: `components/job-board/job-alerts-widget.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { BellRing, Mail, Send } from "lucide-react"

export function JobAlertsWidget() {
  const [email, setEmail] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!valid) {
      toast.error("נא להזין כתובת אימייל תקינה")
      return
    }
    toast.success("נרשמתם בהצלחה!", {
      description: "נעדכן אתכם במשרות חדשות שמתאימות לכם.",
    })
    setEmail("")
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary p-6 text-primary-foreground shadow-md sm:p-8">
      {/* Decorative glow blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -start-10 h-48 w-48 rounded-full bg-primary-foreground/8 blur-2xl"
      />
      <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
            <BellRing className="size-6" />
          </span>
          <div>
            <h3 className="font-heading text-lg font-bold">
              לא לפספס אף משרה
            </h3>
            <p className="mt-1 text-sm text-primary-foreground/75">
              הירשמו והתראות על משרות חדשות יגיעו ישירות למייל שלכם
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row"
        >
          <InputGroup className="w-full bg-background sm:w-64">
            <InputGroupInput
              type="email"
              dir="ltr"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="כתובת אימייל"
            />
            <InputGroupAddon>
              <Mail />
            </InputGroupAddon>
          </InputGroup>
          <Button
            type="submit"
            variant="secondary"
            className="h-11 shrink-0"
          >
            <Send data-icon="inline-start" />
            הרשמה
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Expected:
- Widget is `rounded-2xl` matching the card system
- `shadow-md` gives it a lifted feel
- Decorative glow blob visible in the bottom-start corner
- Typography contrast is strong (off-white on deep green)

- [ ] **Step 3: Commit**

```bash
git add components/job-board/job-alerts-widget.tsx
git commit -m "style: alerts widget — rounded-2xl, shadow-md, decorative blob"
```

---

### Task 7: AdminView — Bug Fixes

**Files:**
- Modify: `components/job-board/admin-view.tsx`

- [ ] **Step 1: Replace the entire file**

Two bugs being fixed:
1. `j.views` — `views` does not exist on `Job` type → replace with `draftJobs` count
2. `<CategoriesTab ... />` was called without the required `setJobs` prop

```tsx
"use client"

import { useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
  BriefcaseIcon,
  LayoutGridIcon,
  InboxIcon,
  SettingsIcon,
  TrendingUpIcon,
  Pencil,
} from "lucide-react"
import { JobsTab } from "@/components/job-board/admin/jobs-tab"
import { CategoriesTab } from "@/components/job-board/admin/categories-tab"
import { ApplicationsTab } from "@/components/job-board/admin/applications-tab"
import { SettingsTab } from "@/components/job-board/admin/settings-tab"
import type { Category, Job, Application, GlobalSettings } from "@/lib/job-board-data"

type Props = {
  jobs: Job[]
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>
  categories: Category[]
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>
  applications: Application[]
  settings: GlobalSettings
  setSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>
}

export function AdminView({
  jobs,
  setJobs,
  categories,
  setCategories,
  applications,
  settings,
  setSettings,
}: Props) {
  const stats = useMemo(() => {
    const activeJobs = jobs.filter((j) => j.status === "active").length
    const draftJobs = jobs.filter((j) => j.status === "draft").length
    return [
      { label: "משרות פעילות", value: activeJobs, icon: BriefcaseIcon },
      { label: "קטגוריות", value: categories.length, icon: LayoutGridIcon },
      { label: "פניות שהתקבלו", value: applications.length, icon: InboxIcon },
      { label: "טיוטות", value: draftJobs, icon: Pencil },
    ]
  }, [jobs, categories, applications])

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
      <header className="mb-8">
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-primary">
          <TrendingUpIcon className="size-4" />
          ניהול מערכת
        </div>
        <h1 className="text-pretty text-3xl font-bold tracking-tight">לוח בקרה</h1>
        <p className="mt-1 text-muted-foreground">ניהול משרות, קטגוריות ופניות מועמדים במקום אחד</p>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-2xl shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <stat.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
                <div className="truncate text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="jobs">
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="jobs">
            <BriefcaseIcon data-icon="inline-start" />
            משרות
          </TabsTrigger>
          <TabsTrigger value="categories">
            <LayoutGridIcon data-icon="inline-start" />
            קטגוריות
          </TabsTrigger>
          <TabsTrigger value="applications">
            <InboxIcon data-icon="inline-start" />
            פניות
          </TabsTrigger>
          <TabsTrigger value="settings">
            <SettingsIcon data-icon="inline-start" />
            הגדרות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <JobsTab jobs={jobs} setJobs={setJobs} categories={categories} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab
            categories={categories}
            setCategories={setCategories}
            jobs={jobs}
            setJobs={setJobs}
          />
        </TabsContent>
        <TabsContent value="applications">
          <ApplicationsTab applications={applications} />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab settings={settings} setSettings={setSettings} />
        </TabsContent>
      </Tabs>
    </main>
  )
}
```

- [ ] **Step 2: Verify admin panel**

Switch to "ממשק מנהל" via the role switcher.

Expected:
- No TypeScript/console errors
- Four stat cards show: משרות פעילות / קטגוריות / פניות שהתקבלו / טיוטות (not "צפיות במשרות")
- Stat cards are `rounded-2xl`
- Categories tab: adding or deleting a category immediately updates the public Category Grid

- [ ] **Step 3: Commit**

```bash
git add components/job-board/admin-view.tsx
git commit -m "fix: remove j.views (not in Job type), pass setJobs to CategoriesTab"
```

---

### Task 8: Final Cross-Device Review

- [ ] **Step 1: Mobile review (375px — iPhone SE)**

In Chrome DevTools device toolbar at 375px:
1. ✅ Hero: sage gradient, blob glow, sticky frosted header
2. ✅ Pill badge visible above heading
3. ✅ Category row scrolls horizontally, no scrollbar, cards snap
4. ✅ Job cards: rounded, shadow, tap feedback
5. ✅ Tap a job card → sheet slides from **bottom**, rounded top, drag handle
6. ✅ Apply buttons always visible (sticky bottom bar), finger-reachable
7. ✅ Job alerts widget: green rounded card

- [ ] **Step 2: Desktop review (1280px)**

At 1280px:
1. ✅ Categories shown as CSS grid (4 columns)
2. ✅ Job drawer slides from the **side** (not bottom)
3. ✅ Header nav links visible
4. ✅ Admin panel: all 4 tabs work, categories sync with public view
5. ✅ No console errors or TypeScript warnings

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: JobMosh warm editorial redesign complete"
```
