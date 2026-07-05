# Salary Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a structured salary field to job listings to surface salary info to job seekers and add `baseSalary` to the Google Jobs Schema.org JSON-LD.

**Architecture:** Add `Salary` discriminated-union type to the domain model, a `formatSalary` display helper to `lib/utils.ts`, then wire salary into the job card, job detail page sidebar, and JSON-LD structured data.

**Tech Stack:** Next.js 16, TypeScript 5.7, Tailwind CSS v4, Lucide React icons

## Global Constraints

- Currency is always ILS (₪) — no multi-currency
- Salary period: `'HOUR'` or `'MONTH'` only
- Numbers formatted with `toLocaleString('he-IL')`
- All UI is RTL Hebrew
- No test framework — use `npx tsc --noEmit` as the type-check step

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `lib/job-board-data.ts` | Modify | Add `SalaryPeriod`, `Salary` types; add `salary?` to `Job`; update seed data |
| `lib/utils.ts` | Modify | Add `formatSalary(salary: Salary): string` helper |
| `app/jobs/[id]/page.tsx` | Modify | Show salary in sidebar; add `baseSalary` to JSON-LD |
| `components/job-board/job-card.tsx` | Modify | Show salary badge below tags row |

---

### Task 1: Add Salary types and update Job model

**Files:**
- Modify: `lib/job-board-data.ts`

**Interfaces:**
- Produces:
  - `export type SalaryPeriod = 'HOUR' | 'MONTH'`
  - `export type Salary = { type: 'range'; min: number; max: number; period: SalaryPeriod } | { type: 'minimum'; min: number; period: SalaryPeriod } | { type: 'undisclosed' }`
  - `salary?: Salary` added to `Job` type

- [ ] **Step 1: Add types to `lib/job-board-data.ts`**

  Open `lib/job-board-data.ts`. After the `export type WorkModel` line (currently around line 19), insert:

  ```typescript
  export type SalaryPeriod = 'HOUR' | 'MONTH'

  export type Salary =
    | { type: 'range';       min: number; max: number; period: SalaryPeriod }
    | { type: 'minimum';     min: number;              period: SalaryPeriod }
    | { type: 'undisclosed' }
  ```

- [ ] **Step 2: Add `salary?` to the `Job` type**

  In the same file, find the `Job` type definition. After the `postedAt: string` field, add:

  ```typescript
  salary?: Salary
  ```

- [ ] **Step 3: Add salary to seed data**

  In `INITIAL_JOBS`, update the first 5 jobs to include salary examples covering all three types. Find each job by its `id` field and add the `salary` property. Example values to use (adapt to each job's context):

  - Job 1 (first entry): `salary: { type: 'range', min: 12000, max: 18000, period: 'MONTH' }`
  - Job 2 (second entry): `salary: { type: 'minimum', min: 45, period: 'HOUR' }`
  - Job 3 (third entry): `salary: { type: 'undisclosed' }`
  - Job 4 (fourth entry): `salary: { type: 'range', min: 8000, max: 11000, period: 'MONTH' }`
  - Job 5 (fifth entry): `salary: { type: 'minimum', min: 9500, period: 'MONTH' }`
  - Remaining jobs: leave `salary` undefined (no field added)

- [ ] **Step 4: Type-check**

  ```
  npx tsc --noEmit
  ```

  Expected: no errors. If errors appear, they point to mismatched types — fix them before continuing.

- [ ] **Step 5: Commit**

  ```bash
  git add lib/job-board-data.ts
  git commit -m "feat: add Salary type and salary field to Job model"
  ```

---

### Task 2: Add `formatSalary` helper

**Files:**
- Modify: `lib/utils.ts`

**Interfaces:**
- Consumes: `Salary` type from `lib/job-board-data.ts`
- Produces: `export function formatSalary(salary: Salary): string`

- [ ] **Step 1: Add `formatSalary` to `lib/utils.ts`**

  Open `lib/utils.ts`. Add the following after the existing `cn` function:

  ```typescript
  import type { Salary, SalaryPeriod } from '@/lib/job-board-data'

  const PERIOD_LABELS: Record<SalaryPeriod, string> = {
    HOUR: 'לשעה',
    MONTH: 'לחודש',
  }

  function fmt(n: number): string {
    return n.toLocaleString('he-IL')
  }

  export function formatSalary(salary: Salary): string {
    if (salary.type === 'undisclosed') return 'לפי ניסיון'
    const period = PERIOD_LABELS[salary.period]
    if (salary.type === 'minimum') return `מ-${fmt(salary.min)} ₪ ${period}`
    return `${fmt(salary.min)}–${fmt(salary.max)} ₪ ${period}`
  }
  ```

- [ ] **Step 2: Type-check**

  ```
  npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add lib/utils.ts
  git commit -m "feat: add formatSalary display helper"
  ```

---

### Task 3: Show salary in job card (list view)

**Files:**
- Modify: `components/job-board/job-card.tsx`

**Interfaces:**
- Consumes: `formatSalary` from `lib/utils.ts`, `Salary` from `lib/job-board-data.ts` (via `job.salary`)

- [ ] **Step 1: Import `formatSalary` in job-card**

  Open `components/job-board/job-card.tsx`. Update the import from `@/lib/utils`:

  ```typescript
  import { cn, formatSalary } from "@/lib/utils"
  ```

- [ ] **Step 2: Add salary display below the tags row**

  Find this block (around line 68–70):

  ```tsx
  <div className="mt-4">
    <JobTags job={job} />
  </div>
  ```

  Replace it with:

  ```tsx
  <div className="mt-4">
    <JobTags job={job} />
  </div>

  {job.salary && (
    <p className="mt-2 text-xs font-medium text-primary/80">
      {formatSalary(job.salary)}
    </p>
  )}
  ```

- [ ] **Step 3: Type-check**

  ```
  npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 4: Visual check**

  Start the dev server (`npm run dev`) and open [http://localhost:3000](http://localhost:3000). Verify:
  - Jobs 1, 4, 5 show a salary string like "12,000–18,000 ₪ לחודש"
  - Job 2 shows "מ-45 ₪ לשעה"
  - Job 3 shows "לפי ניסיון"
  - Jobs without salary show nothing (no empty line)

- [ ] **Step 5: Commit**

  ```bash
  git add components/job-board/job-card.tsx
  git commit -m "feat: display salary on job card"
  ```

---

### Task 4: Show salary in job detail page + JSON-LD

**Files:**
- Modify: `app/jobs/[id]/page.tsx`

**Interfaces:**
- Consumes: `formatSalary` from `lib/utils.ts`, `job.salary` from `Job` type

- [ ] **Step 1: Import `formatSalary`**

  Open `app/jobs/[id]/page.tsx`. Add `formatSalary` to the import from `@/lib/utils`:

  ```typescript
  import { formatSalary } from "@/lib/utils"
  ```

  (Add a new import line — `@/lib/utils` is not currently imported in this file.)

- [ ] **Step 2: Add `baseSalary` to JSON-LD**

  Find the `jsonLd` object (around line 105). After the `directApply` field, add the `baseSalary` block conditionally:

  ```typescript
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.postedAt,
    validThrough: new Date(
      new Date(job.postedAt).getTime() + 60 * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .split("T")[0],
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.city,
        addressCountry: "IL",
      },
    },
    employmentType: EMPLOYMENT_TYPE[job.jobType] ?? "OTHER",
    ...(locationType ? { jobLocationType: locationType } : {}),
    directApply: job.allowSiteApply,
    ...(job.salary && job.salary.type !== 'undisclosed'
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "ILS",
            value: {
              "@type": "QuantitativeValue",
              ...(job.salary.type === 'range'
                ? { minValue: job.salary.min, maxValue: job.salary.max }
                : { minValue: job.salary.min }),
              unitText: job.salary.period,
            },
          },
        }
      : {}),
  }
  ```

- [ ] **Step 3: Show salary in the sticky sidebar**

  In the sidebar section, find the `<h3>הגשת מועמדות</h3>` heading (around line 233). Add the salary display above it:

  ```tsx
  {job.salary && (
    <div className="mb-3 rounded-xl bg-accent px-4 py-3">
      <p className="text-xs text-muted-foreground">שכר</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">
        {formatSalary(job.salary)}
      </p>
    </div>
  )}
  <h3 className="font-heading font-semibold text-foreground">
    הגשת מועמדות
  </h3>
  ```

- [ ] **Step 4: Type-check**

  ```
  npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 5: Visual check — job detail page**

  Open any job with salary (e.g. [http://localhost:3000/jobs/job-1](http://localhost:3000/jobs/job-1) — adjust id to match seed data). Verify:
  - Salary block appears in the sidebar above "הגשת מועמדות"
  - Correct format shown

- [ ] **Step 6: Verify JSON-LD in browser**

  Open browser DevTools → Elements → search for `application/ld+json`. For a job with `range` salary, the script should include:

  ```json
  "baseSalary": {
    "@type": "MonetaryAmount",
    "currency": "ILS",
    "value": {
      "@type": "QuantitativeValue",
      "minValue": 12000,
      "maxValue": 18000,
      "unitText": "MONTH"
    }
  }
  ```

  For a job with `undisclosed` salary or no salary, `baseSalary` should be absent from the JSON-LD.

- [ ] **Step 7: Commit**

  ```bash
  git add app/jobs/[id]/page.tsx
  git commit -m "feat: add salary to job detail sidebar and Google Jobs JSON-LD"
  ```
