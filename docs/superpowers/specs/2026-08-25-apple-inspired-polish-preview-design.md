# JobMosh — Apple-Inspired Premium Polish (Local Preview)

**Date:** 2026-08-25
**Approach:** Token + shared-component pass using the `apple-inspired-premium-ui-ux` skill — spacing, typography scale, hierarchy, and shadow/radius restraint. No color or font changes. Built and previewed in an isolated git worktree; nothing lands on `main` until the user approves it.

---

## 1. Why this scope, and what it deliberately does NOT touch

On 2026-08-08 a full rebrand (new logo, replacing the site's amber "pop" accent with brand green everywhere) was implemented, verified, and then rejected — the all-green result read as monochrome/low-contrast. See `feedback_jobmosh_rebrand_rejected` in project memory.

To avoid repeating that: this pass changes **only** spacing, type scale, visual hierarchy, and shadow/radius consistency. It explicitly leaves alone:

- **Colors** — `--primary` / `--accent` (deep forest green + sage, from the 2026-06-15 redesign) and every `amber-*` "pop" accent usage (hero headline highlight word, sparkle dots, CTA buttons in `public-view.tsx` and `login-gate.tsx`) stay pixel-identical. The green/amber contrast is the thing the user liked; this pass must not touch it.
- **Fonts** — stays on Geist. Swapping to a Hebrew-native family (e.g. Rubik/Heebo, which the skill would otherwise recommend) is a separate, visible identity decision on the same order as the color question — out of scope here unless requested explicitly.
- **Copy, business logic, admin tab behavior, routes** — unchanged.

## 2. What changes

### 2.1 Spacing
Standardize vertical rhythm across full-width sections (hero, category grid, job feed, footer) using a `clamp()`-based scale instead of each section's current one-off `py-*` value, so section breathing room is consistent and scales smoothly between mobile and desktop:
```css
padding-block: clamp(64px, 10vw, 160px);
```
Apply the same `max-w-[1200px] mx-auto px-6` container rule everywhere a full-width section currently varies its own inline padding, so nothing touches the viewport edge on narrow widths (checked in RTL too).

### 2.2 Typography
Introduce a `clamp()`-based responsive scale for headline roles (Hero/H1/H2/H3), replacing today's fixed Tailwind size classes on the hero headline and section titles across `public-view.tsx`, `category-grid.tsx`, and the admin dashboard headers. Weight stays purposeful: 700–800 for the hero line, 600–700 for section titles, 500–600 for buttons — no change to body copy size/weight, which already reads fine.

### 2.3 Hierarchy & whitespace
Pass over the shared components below for the specific anti-patterns the skill calls out (badge overload, borders used as the default separator instead of spacing, one-clear-primary-action per section). Concretely:
- `job-card.tsx`, `category-grid.tsx` — reduce redundant border/shadow stacking where spacing alone can separate elements
- `public-view.tsx` hero — confirm the value proposition reads in the first screen without added elements
- `role-switcher.tsx`, `job-alerts-widget.tsx` — spacing/weight only, no structural change

### 2.4 Radius & shadow
Current `--radius: 1rem` (16px) already matches the skill's "generous, not maxed-out" guidance — left as is. Shadows get a pass to keep them soft (`0 10px 40px rgba(0,0,0,0.06)`-class values) except the intentional amber glow on primary CTAs (`hover:shadow-amber-500/25`), which is a deliberate micro-interaction and stays.

## 3. Isolation & preview

- Work happens in a new git worktree (fresh branch off current `main`), so `C:\Users\Moshe\jobmosh` — including its running dev server and the two changes already sitting there uncommitted (`pnpm-workspace.yaml`, the new `.claude/skills/`) — is untouched.
- The worktree runs its own `npx pnpm dev` on whatever port is free.
- Preview is delivered as Playwright screenshots (desktop + mobile) of: homepage/hero, job feed, a job detail drawer, and the apply form — shown inline in the conversation. The user can also open the worktree's local URL directly if they want to click around themselves.
- Nothing merges to `main` from this pass without explicit approval after reviewing the preview.

## 4. Files likely touched

| File | Change |
|---|---|
| `app/globals.css` | Section spacing scale, type-scale custom properties/utilities, shadow softening |
| `components/job-board/public-view.tsx` | Hero + section spacing/type scale, hierarchy pass |
| `components/job-board/category-grid.tsx` | Spacing/type scale, hierarchy pass |
| `components/job-board/job-card.tsx` | Spacing/shadow consistency |
| `components/job-board/job-drawer.tsx` | Spacing/type scale only |
| `components/job-board/job-alerts-widget.tsx` | Spacing/weight only |
| `components/job-board/role-switcher.tsx` | Spacing/weight only |
| `components/job-board/admin-view.tsx` | Section heading type scale only (no logic changes) |

## 5. Out of scope

- No color-token changes (`--primary`, `--accent`, amber pop-accent usages)
- No font-family change
- No new npm packages
- No new routes, no admin logic changes
- No dark-mode changes
- Not merged to `main` — preview only, pending approval
