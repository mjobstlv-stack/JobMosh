# Apple-Inspired Polish Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply a spacing/typography/hierarchy-only visual polish pass (per `docs/superpowers/specs/2026-08-25-apple-inspired-polish-preview-design.md`) to JobMosh's public site, previewed locally in an isolated worktree, with no color or font changes.

**Architecture:** Tailwind utility-class edits directly in the existing JSX (no new CSS variable layer — this codebase styles everything via inline Tailwind classes, so responsive spacing/type sizing uses Tailwind's arbitrary-value `clamp()` syntax, e.g. `py-[clamp(3rem,6vw,5rem)]`, consistent with how the rest of the app is written). Only shared, high-traffic public-facing components are touched: hero, main content sections, category grid, job card, job drawer.

**Tech Stack:** Next.js 16 / React 19 / Tailwind CSS 4 (utility classes, no CSS Modules or styled-components) / shadcn ui primitives.

## Global Constraints

- No changes to `--primary`, `--accent`, or any `amber-*`/`bg-amber-*`/`text-amber-*` class usage — the green/amber contrast is explicitly preserved (see spec §1).
- No font-family changes — stays on Geist (`font-heading`/`font-sans` in `globals.css`).
- No changes to `lib/`, business logic, admin tab behavior, or routes.
- This repo has **no test framework** (`package.json` has no `test` script, no `*.test.*` files exist). Verification for every task in this plan is: (a) `npx pnpm build` completes without type/lint errors, and (b) the dev server renders the changed component without console errors. The final task adds a visual screenshot pass as the acceptance check for the whole plan — there is no unit-test step to write.
- Work happens inside a git worktree (create via `superpowers:using-git-worktrees` before Task 1) so the main `C:\Users\Moshe\jobmosh` checkout — including its running dev server and unrelated uncommitted files — is untouched.
- Commit after each task.

## Deviations from the spec

- **Hero's own vertical padding is left untouched**, though spec §2.1 lists the hero among sections to standardize. The hero's `pt-8 pb-28 sm:pt-12 sm:pb-36` is tightly coupled to its `min-h-[70vh]` sizing and staggered entrance animations (`hero-reveal`/`hero-word-pop` delays) — changing it risks visibly breaking that choreography for a preview pass that's supposed to be low-risk. Only the hero's headline *type scale* changes (Task 1).
- **`role-switcher.tsx`, `job-alerts-widget.tsx`, and `admin-view.tsx`** (listed in spec §4 as spacing/weight-only touches) are **not included in this plan**. They aren't part of the four surfaces this preview is meant to show (homepage, job feed, job drawer, apply form — spec §3), and admin-view isn't reachable without logging in. If the user approves the direction on these five tasks, a follow-up pass can extend the same scale to those three files.
- **Several spec items ended up out of scope entirely, narrowing this pass to spacing/typography only.** Spec §2.1's `max-w-[1200px] mx-auto px-6` container-padding rule was not applied — `<main>` in `public-view.tsx` still uses its original `px-4`. Spec §2.3's border/shadow de-stacking on `job-card.tsx`/`category-grid.tsx` was not done — only padding/type changed on those files, not their border/shadow usage. Spec §2.4's shadow-softening pass was not done anywhere. `app/globals.css` (listed in spec §4's file table) was never touched by this plan's tasks. These were left for a possible follow-up pass rather than expanding this preview's risk surface beyond spacing/typography.

---

### Task 1: Hero and section-heading type scale

**Files:**
- Modify: `components/job-board/public-view.tsx:386` (hero `<h1>`), `components/job-board/public-view.tsx:568-572` (jobs-section `<h2>`), `components/job-board/public-view.tsx:656` (CTA `<h2>`)

**Interfaces:** None (leaf JSX className edits only — no props/exports change).

- [ ] **Step 1: Widen the hero headline's responsive range**

Current (`public-view.tsx:386`):
```tsx
<h1 className="text-balance text-center text-3xl font-extrabold leading-tight text-white sm:text-5xl">
```
Change to:
```tsx
<h1 className="text-balance text-center text-[clamp(1.875rem,5vw,3.5rem)] font-extrabold leading-tight text-white">
```
This replaces the two-step `text-3xl` → `sm:text-5xl` jump (30px → 48px) with smooth scaling from 30px up to 56px, giving the headline more presence on desktop without changing its mobile size.

**Note:** do not touch the `<span>` elements or their animation classes/delays inside this `<h1>` — only the outer element's className.

- [ ] **Step 2: Give the two `text-xl` section headings more weight**

Current, `public-view.tsx:568-572` (jobs-section heading):
```tsx
<h2
  id="jobs-heading"
  className="font-heading text-xl font-bold text-foreground"
>
  משרות פתוחות
</h2>
```
Change to:
```tsx
<h2
  id="jobs-heading"
  className="font-heading text-2xl sm:text-3xl font-bold text-foreground"
>
  משרות פתוחות
</h2>
```

Current, `public-view.tsx:656` (employer CTA heading):
```tsx
<h2 className="font-heading text-xl font-bold text-foreground">מגייסים?</h2>
```
Change to:
```tsx
<h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">מגייסים?</h2>
```

- [ ] **Step 3: Verify**

Run: `npx pnpm build`
Expected: build completes with no type errors.

Then `npx pnpm dev`, open the homepage, confirm: hero headline scales visibly larger on a wide viewport than before, both section headings ("משרות פתוחות", "מגייסים?") read noticeably larger than the body text around them, no layout overflow at 375px width.

- [ ] **Step 4: Commit**

```bash
git add components/job-board/public-view.tsx
git commit -m "style: widen hero and section heading type scale"
```

---

### Task 2: Section spacing rhythm (main content, CTA, footer)

**Files:**
- Modify: `components/job-board/public-view.tsx:526` (`<main>` wrapper), `components/job-board/public-view.tsx:654` (employer CTA `<section>`), `components/job-board/public-view.tsx:669` (`<footer>`)

**Interfaces:** None.

- [ ] **Step 1: Increase main content vertical padding**

Current (`public-view.tsx:526`):
```tsx
<main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
```
Change to:
```tsx
<main className="mx-auto max-w-6xl px-4 py-[clamp(3rem,8vw,6rem)]">
```
(48px on mobile up to 96px on desktop — deliberately less than the skill's full 64–160px hero range, since this wraps a dense job listing, not a marketing section; going further would push job cards too far below the fold.)

- [ ] **Step 2: Increase employer CTA section padding**

Current (`public-view.tsx:654`):
```tsx
<section className="border-t border-border bg-accent/30 py-10 text-center">
```
Change to:
```tsx
<section className="border-t border-border bg-accent/30 py-[clamp(3rem,6vw,5rem)] text-center">
```

- [ ] **Step 3: Increase footer padding slightly**

Current (`public-view.tsx:669`):
```tsx
<footer className="border-t border-border py-8 text-center">
```
Change to:
```tsx
<footer className="border-t border-border py-[clamp(2.5rem,5vw,4rem)] text-center">
```

- [ ] **Step 4: Verify**

Run: `npx pnpm build` — expect no errors.
Then in the dev server, scroll the homepage top to bottom at both a mobile width (375px) and a wide desktop width (1440px): confirm each section (main content, employer CTA, footer) has visibly more breathing room than before, and that the `max-w-[1200px]`-equivalent (`max-w-6xl`) container still keeps side margins at every width — no content touching the viewport edge.

- [ ] **Step 5: Commit**

```bash
git add components/job-board/public-view.tsx
git commit -m "style: increase section vertical spacing rhythm"
```

---

### Task 3: Category grid heading and card breathing room

**Files:**
- Modify: `components/job-board/category-grid.tsx:34-39` (heading), `components/job-board/category-grid.tsx:94-101` (`CategoryCard` className)

**Interfaces:** None — `CategoryGrid`/`CategoryCard` props unchanged.

- [ ] **Step 1: Match the heading to the new H2 scale from Task 1**

Current (`category-grid.tsx:34-39`):
```tsx
<h2
  id="categories-heading"
  className="font-heading text-xl font-bold text-foreground"
>
  עיון לפי תחום
</h2>
```
Change to:
```tsx
<h2
  id="categories-heading"
  className="font-heading text-2xl sm:text-3xl font-bold text-foreground"
>
  עיון לפי תחום
</h2>
```

- [ ] **Step 2: Align card padding to the spacing scale**

Current (`category-grid.tsx:94-101`):
```tsx
className={cn(
  "flex flex-col items-start gap-3 rounded-2xl border p-4 text-right transition-all duration-300",
  "snap-start shrink-0 w-[140px] min-h-[120px]",
  "sm:w-auto sm:shrink",
  active
    ? "border-primary bg-primary text-primary-foreground shadow-md"
    : "border-border bg-card text-foreground hover:border-primary/30 hover:shadow-md hover:scale-[1.02]",
)}
```
Change `p-4` (16px) to `p-5` (20px) — one step up on the skill's spacing scale (4/8/12/16/24/32), giving the icon and label a bit more room without changing the card's `w-[140px]`/`min-h-[120px]` footprint:
```tsx
className={cn(
  "flex flex-col items-start gap-3 rounded-2xl border p-5 text-right transition-all duration-300",
  "snap-start shrink-0 w-[140px] min-h-[120px]",
  "sm:w-auto sm:shrink",
  active
    ? "border-primary bg-primary text-primary-foreground shadow-md"
    : "border-border bg-card text-foreground hover:border-primary/30 hover:shadow-md hover:scale-[1.02]",
)}
```

- [ ] **Step 3: Verify**

Run: `npx pnpm build` — expect no errors.
In the dev server, confirm the "עיון לפי תחום" heading matches the size of "משרות פתוחות" below it, and category cards (both the horizontal mobile carousel and the desktop grid) still lay out without overlap or clipping.

- [ ] **Step 4: Commit**

```bash
git add components/job-board/category-grid.tsx
git commit -m "style: match category heading scale, widen card padding"
```

---

### Task 4: Job card padding alignment

**Files:**
- Modify: `components/job-board/job-card.tsx:51` (`Card` className)

**Interfaces:** None — `JobCard` props unchanged.

- [ ] **Step 1: Bump card padding one step on the spacing scale**

Current (`job-card.tsx:51`):
```tsx
className="group cursor-pointer gap-0 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:scale-[1.01] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
```
Change `p-5` (20px) to `p-6` (24px):
```tsx
className="group cursor-pointer gap-0 rounded-2xl p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:scale-[1.01] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
```
Leave every other class (radius, shadow, hover, focus ring) untouched — this card is already close to the skill's "soft shadow, restrained border" guidance.

- [ ] **Step 2: Verify**

Run: `npx pnpm build` — expect no errors.
In the dev server job feed (2-column grid on desktop), confirm cards have visibly more internal padding and the 2-column grid still doesn't overflow or leave ragged card heights.

- [ ] **Step 3: Commit**

```bash
git add components/job-board/job-card.tsx
git commit -m "style: widen job card padding"
```

---

### Task 5: Job drawer section-title consistency

**Files:**
- Modify: `components/job-board/job-drawer.tsx:90` (job title in drawer header), `components/job-board/job-drawer.tsx:106,111,124` (three in-body section `<h3>`s)

**Interfaces:** None — `JobDrawer` props unchanged.

- [ ] **Step 1: Give the drawer's job title a touch more weight**

Current (`job-drawer.tsx:90`):
```tsx
<p className="text-xl font-bold leading-tight text-foreground">{job.title}</p>
```
Change to:
```tsx
<p className="text-2xl font-bold leading-tight text-foreground">{job.title}</p>
```

- [ ] **Step 2: Make the three body section titles consistent with each other**

All three currently read (`job-drawer.tsx:106`, `:111`, `:124`):
```tsx
<h3 className="font-heading text-sm font-semibold text-foreground">...</h3>
```
This is already consistent across the three — leave as is. (No change in this step; confirmed while reading the file so a future pass doesn't re-flag it.)

- [ ] **Step 3: Verify**

Run: `npx pnpm build` — expect no errors.
Open a job's drawer (mobile bottom sheet and desktop side sheet), confirm the job title in the header is visibly larger than the "תיאור המשרה"/"דרישות התפקיד" section titles below it, and the sheet still fits within `max-h-[92dvh]` on mobile without the header wrapping awkwardly for a long title — check with a job whose title is long.

- [ ] **Step 4: Commit**

```bash
git add components/job-board/job-drawer.tsx
git commit -m "style: increase job drawer title size"
```

---

### Task 6: Local preview — dev server + screenshots

**Files:** None created or modified — this task only runs the app and captures output.

**Interfaces:** Consumes the finished state of Tasks 1–5.

- [ ] **Step 1: Start the dev server in the worktree**

Run: `npx pnpm dev`
Expected: server starts (note whichever port it binds to — 3000 is usually taken on this machine and it falls back to 3002).

- [ ] **Step 2: Capture desktop screenshots (1440×900)**

Using Playwright (`mcp__plugin_playwright_playwright__browser_navigate` + `browser_resize` to 1440×900 + `browser_take_screenshot`), capture:
- Homepage (hero + jobs feed) — full page
- A job card click → job drawer open (desktop Sheet)
- The apply form (click "הגש מועמדות" inside the open drawer/dialog)

- [ ] **Step 3: Capture mobile screenshots (390×844)**

Resize to 390×844 and repeat the same three captures (homepage, job drawer as the mobile bottom sheet, apply form).

- [ ] **Step 4: Present screenshots**

Show all six screenshots inline in the conversation for review. Do not merge the worktree branch or touch `main` — this task's only output is the screenshots and the six commits from Tasks 1–5, sitting on the worktree's branch pending the user's decision.
