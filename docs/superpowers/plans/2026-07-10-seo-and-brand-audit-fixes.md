# SEO & Brand Audit Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical, high, and medium issues from the July 2026 site audit — covering www/canonical SEO, brand copy consistency, contact details, accessibility, and UX.

**Architecture:** All changes are to existing Next.js App Router files and one shared component (`public-view.tsx`). No new npm dependencies. Each task is independently deployable.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Tailwind v4, Hebrew RTL (`dir="rtl"`), Vercel hosting, `@vercel/blob` for job storage.

## Global Constraints

- All new UI text must be Hebrew; `dir="rtl"` is already on the root `<html>`
- No new npm dependencies allowed
- `npm run build` must pass (TypeScript + Next.js compilation) after every task
- Audit items #1 (SSR job pages) and #2 (JSON-LD) are **already implemented** — skip them
- `NEXT_PUBLIC_SITE_URL` env var in Vercel must be set to `https://www.jobmosh.co.il` (Task 1 step 8 is manual)
- The canonical host is `www.jobmosh.co.il` — every URL in the codebase should use this
- Brand voice: use **"מושלם"** everywhere (already used in the UI) — not "מוביל"
- Contact email everywhere must be `info@jobmosh.co.il` — not `mjobstlv@gmail.com`

---

### Task 1: Fix www/non-www redirect and canonical URLs (Audit #3, #4)

**Files:**
- Modify: `next.config.mjs` — add www redirect
- Modify: `app/layout.tsx` — fix `SITE_URL` default to www
- Modify: `app/sitemap.ts` — fix `BASE_URL` default to www
- Modify: `app/jobs/[id]/page.tsx` — fix `SITE_URL` default to www
- Modify: `app/terms/page.tsx` — add per-page canonical
- Modify: `app/privacy/page.tsx` — add per-page canonical

**Why:** The site serves at `www.jobmosh.co.il` but all canonical tags, OG URLs, and sitemap entries currently default to `https://jobmosh.co.il` (non-www). Search engines see split signals; Google may index the wrong host. Terms/Privacy inherit the root layout's canonical (homepage URL) because they don't declare their own — a minor but real bug.

**Interfaces:**
- Produces: All generated URLs use `https://www.jobmosh.co.il`; non-www → www 301 redirect active

- [ ] **Step 1: Add www redirect in next.config.mjs**

Open `next.config.mjs`. Add a `redirects()` method inside `nextConfig`, before the existing `headers()`:

```javascript
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "jobmosh.co.il" }],
        destination: "https://www.jobmosh.co.il/:path*",
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}
```

- [ ] **Step 2: Fix SITE_URL default in app/layout.tsx**

Line 13 — change from:
```typescript
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobmosh.co.il"
```
To:
```typescript
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jobmosh.co.il"
```

- [ ] **Step 3: Fix BASE_URL default in app/sitemap.ts**

Lines 8-9 — change from:
```typescript
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobmosh.co.il"
```
To:
```typescript
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jobmosh.co.il"
```

- [ ] **Step 4: Fix SITE_URL default in app/jobs/[id]/page.tsx**

Line 28 — change from:
```typescript
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobmosh.co.il"
```
To:
```typescript
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jobmosh.co.il"
```

- [ ] **Step 5: Add per-page canonical to app/terms/page.tsx**

Add `SITE_URL` constant and update the metadata export. The file currently starts with:
```typescript
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export const metadata: Metadata = {
  title: "תנאי שירות",
  description: "תנאי השירות של ג'וב מוש — לוח הדרושים המוביל בישראל.",
  robots: { index: false },
}
```

Replace with:
```typescript
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jobmosh.co.il"

export const metadata: Metadata = {
  title: "תנאי שירות",
  description: "תנאי השירות של ג'וב מוש.",
  robots: { index: false },
  alternates: { canonical: `${SITE_URL}/terms` },
}
```

- [ ] **Step 6: Add per-page canonical to app/privacy/page.tsx**

The file currently starts with:
```typescript
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description: "מדיניות הפרטיות של ג'וב מוש — כיצד אנו אוספים ומעבדים מידע אישי.",
  robots: { index: false },
}
```

Replace with:
```typescript
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jobmosh.co.il"

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description: "מדיניות הפרטיות של ג'וב מוש — כיצד אנו אוספים ומעבדים מידע אישי.",
  robots: { index: false },
  alternates: { canonical: `${SITE_URL}/privacy` },
}
```

- [ ] **Step 7: Verify build passes**

```bash
npm run build
```

Expected: TypeScript passes, build succeeds, no new errors.

- [ ] **Step 8: (Manual) Update Vercel environment variable**

In the Vercel dashboard → Project → Settings → Environment Variables:
Set `NEXT_PUBLIC_SITE_URL` = `https://www.jobmosh.co.il` for Production environment.
This cannot be done from code.

- [ ] **Step 9: Commit**

```bash
git add next.config.mjs app/layout.tsx app/sitemap.ts "app/jobs/[id]/page.tsx" app/terms/page.tsx app/privacy/page.tsx
git commit -m "fix: www redirect, canonical URLs use www host throughout"
```

---

### Task 2: Fix brand copy and remove meta keywords (Audit #5, #6, Low)

**Files:**
- Modify: `app/layout.tsx` — fix title, description, remove `keywords`

**Why:** The root layout says "המוביל" and "אלפי משרות" — the UI consistently uses "המושלם" and the active job count is small. Meta keywords have been ignored by search engines since ~2009. Align copy to what's already in the UI and what's honest.

**Interfaces:**
- Produces: consistent "מושלם" brand voice; no false "אלפי משרות" claim; no meta keywords

- [ ] **Step 1: Update metadata in app/layout.tsx**

Locate the `export const metadata: Metadata` block. Replace the entire block with:

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ג'וב מוש · לוח הדרושים המושלם בישראל",
    template: "%s | ג'וב מוש",
  },
  description:
    "מצאו את המשרה הבאה שלכם — חיפוש לפי אזור, היקף משרה ומודל עבודה. משרות נבחרות בישראל, הגשת מועמדות מהירה באתר או בוואטסאפ.",
  authors: [{ name: "ג'וב מוש" }],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: SITE_URL,
    siteName: "ג'וב מוש",
    title: "ג'וב מוש · לוח הדרושים המושלם בישראל",
    description: "משרות נבחרות מחברות מובילות. הגשת מועמדות מהירה באתר או בוואטסאפ.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "ג'וב מוש — לוח הדרושים המושלם בישראל",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ג'וב מוש · לוח הדרושים המושלם בישראל",
    description: "משרות נבחרות מחברות מובילות. הגשת מועמדות מהירה.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
}
```

Key changes vs. current:
- `keywords` field removed entirely
- `"המוביל"` → `"המושלם"` in title, OG, Twitter
- `"אלפי משרות"` → `"משרות נבחרות"` in description and OG

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "fix: brand copy — מושלם throughout, remove keywords, honest description"
```

---

### Task 3: Fix contact email and social link cleanup (Audit #7)

**Files:**
- Modify: `app/terms/page.tsx` — replace gmail with info@jobmosh.co.il (1 occurrence)
- Modify: `app/privacy/page.tsx` — replace gmail with info@jobmosh.co.il (2 occurrences)
- Modify: `components/job-board/public-view.tsx` — strip Instagram tracking param; add visible labels to dual Telegram links in footer

**Why:** `mjobstlv@gmail.com` appears in legal pages — signals "side project" and undermines employer/candidate trust. Instagram URL contains `?igsh=ZWNsb2o0OHBheDNz` (a personal share token). Two Telegram links in the footer display identically (same icon, no label), making them look like a bug.

- [ ] **Step 1: Replace Gmail in app/terms/page.tsx**

Search for `mjobstlv@gmail.com` (appears around line 112). Change:
```tsx
<a href="mailto:mjobstlv@gmail.com" className="text-primary underline">
  mjobstlv@gmail.com
</a>
```
To:
```tsx
<a href="mailto:info@jobmosh.co.il" className="text-primary underline">
  info@jobmosh.co.il
</a>
```

- [ ] **Step 2: Replace Gmail in app/privacy/page.tsx**

Search for `mjobstlv@gmail.com` — appears twice (around lines 101 and 119). Replace both:
```tsx
<a href="mailto:info@jobmosh.co.il" className="text-primary underline">
  info@jobmosh.co.il
</a>
```

- [ ] **Step 3: Fix SOCIAL_LINKS in public-view.tsx**

Find the `SOCIAL_LINKS` const (around line 41). Replace the entire array:

```typescript
const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/mjobstlv", icon: FaInstagram, label: "אינסטגרם", color: "hover:text-pink-400" },
  { href: "https://t.me/+SqyxSwOXhjEyMWE0", icon: FaTelegram, label: "קבוצת טלגרם", color: "hover:text-sky-400" },
  { href: "https://t.me/mjobsisrael", icon: FaTelegram, label: "ערוץ טלגרם", color: "hover:text-sky-300" },
  { href: "https://www.facebook.com/MjobsTlv", icon: FaFacebook, label: "פייסבוק", color: "hover:text-blue-400" },
]
```

(Removes `?igsh=ZWNsb2o0OHBheDNz` from Instagram.)

- [ ] **Step 4: Add visible Telegram labels in footer**

In the footer social links `<div>` (around line 671), the current render is:
```tsx
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
```

Replace with:
```tsx
{SOCIAL_LINKS.map(({ href, icon: Icon, label, color }) => (
  <a
    key={href}
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    title={label}
    className={cn("flex items-center gap-1 text-muted-foreground/40 transition-colors duration-200 text-[11px]", color)}
  >
    <Icon size={20} />
    {(label === "קבוצת טלגרם" || label === "ערוץ טלגרם") && (
      <span className="hidden sm:inline">{label}</span>
    )}
  </a>
))}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add app/terms/page.tsx app/privacy/page.tsx components/job-board/public-view.tsx
git commit -m "fix: domain email info@jobmosh.co.il, strip Instagram tracking param, label Telegram links"
```

---

### Task 4: aria-hidden on H1 decorators + obscure admin footer link (Audit #9, #14)

**Files:**
- Modify: `components/job-board/public-view.tsx`

**Why:** Screen readers read aloud `✦`, `✧`, `⋆` that are inside the H1 — these are purely decorative. The "כניסת מנהל" button in the public footer advertises the admin entry point to all visitors and is an invitation to credential-stuffing bots.

- [ ] **Step 1: Add aria-hidden to sparkle spans inside H1**

In `public-view.tsx`, find the sparkle spans inside the H1 (the `.sparkle-dot` spans around lines 392-399). Add `aria-hidden="true"` to each:

```tsx
<span aria-hidden="true" className="sparkle-dot text-[13px]" style={{ top: "-13px", right: "4px",  animationDelay: "0.8s"  }}>✦</span>
<span aria-hidden="true" className="sparkle-dot text-[8px]"  style={{ top: "-8px",  right: "-10px", animationDelay: "1.3s"  }}>✧</span>
<span aria-hidden="true" className="sparkle-dot text-[10px]" style={{ top: "-6px",  left: "-12px",  animationDelay: "1.9s"  }}>✦</span>
<span aria-hidden="true" className="sparkle-dot text-[7px]"  style={{ top: "30%",   right: "-13px", animationDelay: "0.5s"  }}>⋆</span>
<span aria-hidden="true" className="sparkle-dot text-[9px]"  style={{ bottom: "-8px", right: "8px", animationDelay: "2.1s"  }}>✦</span>
<span aria-hidden="true" className="sparkle-dot text-[7px]"  style={{ bottom: "-5px", left: "2px",  animationDelay: "1.6s"  }}>✧</span>
<span aria-hidden="true" className="sparkle-dot text-[11px]" style={{ bottom: "20%", left: "-14px", animationDelay: "2.6s"  }}>✦</span>
```

Also add `aria-hidden="true"` to the hover sparkle in the logo (the `✦` span inside the nav logo area, around line 275):
```tsx
<span aria-hidden="true" className="absolute -top-1.5 -left-2 text-[10px] opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-y-1 select-none pointer-events-none">
  ✦
</span>
```

- [ ] **Step 2: Obscure admin link in footer**

Find the "כניסת מנהל" button in the footer (around line 692-697):
```tsx
<button
  onClick={onSwitchToAdmin}
  className="transition-colors hover:text-muted-foreground/80"
>
  כניסת מנהל
</button>
```

Replace with a near-invisible dot that still works as a click target:
```tsx
<button
  onClick={onSwitchToAdmin}
  className="text-muted-foreground/15 hover:text-muted-foreground/40 transition-colors select-none"
  aria-label="כניסה למנהל"
>
  ·
</button>
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add components/job-board/public-view.tsx
git commit -m "fix: aria-hidden on H1 sparkles, obscure admin footer link"
```

---

### Task 5: Hebrew pluralization in category grid (Audit #10)

**Files:**
- Modify: `components/job-board/category-grid.tsx`

**Why:** `{count} משרות` always renders "1 משרות" for singular categories — grammatically wrong in Hebrew. Correct form is "משרה אחת".

- [ ] **Step 1: Add pluralization helper to category-grid.tsx**

At the top of the file, after the imports, before the `CategoryGrid` function, add:

```typescript
function countLabel(n: number): string {
  return n === 1 ? "משרה אחת" : `${n} משרות`
}
```

- [ ] **Step 2: Use the helper in CategoryCard**

In the `CategoryCard` component, find line 117:
```tsx
{count} משרות
```

Replace with:
```tsx
{countLabel(count)}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add components/job-board/category-grid.tsx
git commit -m "fix: Hebrew singular/plural for category job count (אחת vs משרות)"
```

---

### Task 6: Add employer CTA section (Audit #13)

**Files:**
- Modify: `components/job-board/public-view.tsx` — add employer section before footer

**Why:** JobMosh is a two-sided marketplace with no employer-facing funnel. Employers who visit the site have no obvious path to post a job. A simple CTA section with a mailto link is the minimal viable fix.

- [ ] **Step 1: Add employer CTA before the footer**

In `public-view.tsx`, find the `<footer>` element (around line 667). Insert this section immediately before it:

```tsx
{/* Employer CTA */}
<section className="border-t border-border bg-accent/30 py-10 text-center">
  <div className="mx-auto max-w-xl px-4">
    <h2 className="font-heading text-xl font-bold text-foreground">מגייסים?</h2>
    <p className="mt-2 text-sm text-muted-foreground">
      פרסמו משרה בחינם בג&apos;וב מוש והגיעו למועמדים רלוונטיים דרך האתר, וואטסאפ, טלגרם ואינסטגרם.
    </p>
    <a
      href="mailto:info@jobmosh.co.il?subject=פרסום%20משרה"
      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
    >
      צרו קשר לפרסום משרה
    </a>
  </div>
</section>
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/job-board/public-view.tsx
git commit -m "feat: add employer CTA section before footer"
```

---

### Task 7: Accessibility statement page + footer link (Audit #8)

**Files:**
- Create: `app/accessibility/page.tsx`
- Modify: `components/job-board/public-view.tsx` — add "נגישות" link in footer
- Modify: `app/sitemap.ts` — add `/accessibility` entry

**Why:** Israeli accessibility regulations (IS 5568) expect service websites to publish an accessibility statement. The privacy policy mentions accessibility features but links nowhere. This also adds legitimacy for both candidates and employers.

- [ ] **Step 1: Create app/accessibility/page.tsx**

```tsx
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jobmosh.co.il"

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description: "הצהרת נגישות של ג'וב מוש בהתאם לתקן ישראלי 5568.",
  alternates: { canonical: `${SITE_URL}/accessibility` },
}

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronRight className="size-4" />
            חזרה לדף הבית
          </Link>
          <Link href="/" className="font-heading text-base font-extrabold text-foreground">
            ג&apos;וב<span className="text-primary">מוש</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold text-foreground">הצהרת נגישות</h1>
        <p className="mb-8 text-sm text-muted-foreground">עודכן לאחרונה: יולי 2026</p>

        <div className="space-y-8 text-foreground/80 leading-relaxed">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">כללי</h2>
            <p>
              ג&apos;וב מוש (<a href="https://www.jobmosh.co.il" className="text-primary underline">www.jobmosh.co.il</a>)
              שואפת לאפשר שימוש שווה ונוח לכל אדם, כולל אנשים עם מוגבלות, בהתאם
              לחוק שוויון זכויות לאנשים עם מוגבלות, תשנ&quot;ח–1998, ותקן ישראלי 5568.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">רמת הנגישות</h2>
            <p className="mb-2">
              האתר עומד ברמת נגישות AA בהתאם לתקן WCAG 2.1, באופן חלקי. פעלנו להנגשת האתר בין היתר ב:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>תמיכה בקורא מסך</li>
              <li>ניווט מקלדת מלא</li>
              <li>תגיות ARIA מתאימות</li>
              <li>כפתור נגישות לשינוי גופן וניגוד צבעים</li>
              <li>תמיכה בכיוון RTL מלא</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">פערים ידועים</h2>
            <p>
              חלק מהתכנים שנוצרו על ידי גורמים חיצוניים עשויים שלא להיות נגישים במלואם.
              אנו עובדים על שיפור מתמיד של נגישות האתר.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">יצירת קשר בנושא נגישות</h2>
            <p className="mb-2">נתקלתם בבעיית נגישות? נשמח לשמוע ולתקן:</p>
            <ul className="space-y-1">
              <li>
                מייל:{" "}
                <a href="mailto:info@jobmosh.co.il" className="text-primary underline">
                  info@jobmosh.co.il
                </a>
              </li>
              <li>נושא: &quot;בקשת נגישות&quot;</li>
              <li>זמן מענה: עד 5 ימי עסקים</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Add "נגישות" link in footer**

In `public-view.tsx`, find the footer links `<div>` (around line 685). The current content:
```tsx
<div className="flex items-center justify-center gap-5 text-xs text-muted-foreground/50">
  <a href="/terms" className="transition-colors hover:text-muted-foreground">
    תנאי שירות
  </a>
  <a href="/privacy" className="transition-colors hover:text-muted-foreground">
    מדיניות פרטיות
  </a>
  <button
    onClick={onSwitchToAdmin}
    ...
  >
    כניסת מנהל
  </button>
</div>
```

Replace with (note: the admin button should already be the obscured dot from Task 4):
```tsx
<div className="flex items-center justify-center gap-5 text-xs text-muted-foreground/50">
  <a href="/terms" className="transition-colors hover:text-muted-foreground">
    תנאי שירות
  </a>
  <a href="/privacy" className="transition-colors hover:text-muted-foreground">
    מדיניות פרטיות
  </a>
  <a href="/accessibility" className="transition-colors hover:text-muted-foreground">
    נגישות
  </a>
  <button
    onClick={onSwitchToAdmin}
    className="text-muted-foreground/15 hover:text-muted-foreground/40 transition-colors select-none"
    aria-label="כניסה למנהל"
  >
    ·
  </button>
</div>
```

- [ ] **Step 3: Add /accessibility to sitemap**

In `app/sitemap.ts`, add to the return array (after the privacy entry):
```typescript
{
  url: `${BASE_URL}/accessibility`,
  lastModified: new Date("2026-07-10"),
  changeFrequency: "yearly" as const,
  priority: 0.3,
},
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: `/accessibility` route appears in build output; no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add app/accessibility/page.tsx components/job-board/public-view.tsx app/sitemap.ts
git commit -m "feat: accessibility statement page, footer link, sitemap entry"
```

---

## Final Step: Deploy

After all 7 tasks are committed:

```bash
npx vercel --prod --yes
```

Then manually verify in browser:
1. `http://jobmosh.co.il` → 301 to `https://www.jobmosh.co.il` ✓
2. `view-source:https://www.jobmosh.co.il/jobs/job-1` → contains `<script type="application/ld+json">` and `<title>` ✓
3. `https://www.jobmosh.co.il/terms` → canonical points to `/terms` not homepage ✓
4. Footer shows "נגישות" link ✓
5. Footer admin button is a barely-visible dot ✓
6. Category with 1 job shows "משרה אחת" ✓
7. `https://www.jobmosh.co.il/accessibility` loads the new page ✓
8. Terms/Privacy show `info@jobmosh.co.il` ✓
