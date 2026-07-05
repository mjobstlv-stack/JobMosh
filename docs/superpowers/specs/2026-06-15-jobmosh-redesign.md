# JobMosh — Warm Editorial Redesign + Mobile-First UX

**Date:** 2026-06-15  
**Approach:** Targeted enhancement — keep lib/, components/ui/, and admin tab logic; upgrade CSS palette + mobile UX patterns + visual polish.

---

## 1. Palette & CSS Variables (`globals.css`)

Replace all `:root` color tokens with the **Warm Editorial / Premium Earthy** system:

| Token | Value (OKLCH) | Approx Hex | Role |
|---|---|---|---|
| `--background` | `oklch(0.982 0.004 80)` | #FAFAF6 | Warm off-white body |
| `--foreground` | `oklch(0.18 0.012 45)` | #292524 | Charcoal text |
| `--card` | `oklch(1 0 0)` | #FFFFFF | Cards |
| `--primary` | `oklch(0.22 0.07 145)` | #163300 | Deep Forest Green |
| `--primary-foreground` | `oklch(0.98 0 0)` | #FAFAF9 | Text on primary |
| `--accent` | `oklch(0.93 0.04 145)` | #D1E2D3 | Soft Sage |
| `--accent-foreground` | `oklch(0.22 0.07 145)` | #163300 | Text on sage |
| `--muted` | `oklch(0.955 0.006 80)` | #F5F4F0 | Muted surfaces |
| `--muted-foreground` | `oklch(0.50 0.015 60)` | #78716C | Muted text |
| `--border` | `oklch(0.91 0.008 60)` | #E7E5E4 | Warm stone border |
| `--ring` | `oklch(0.22 0.07 145)` | #163300 | Focus ring |
| `--radius` | `1rem` | — | Base radius (up from 0.75rem) |
| `--whatsapp` | keep green | — | Unchanged |

Amber accent `oklch(0.65 0.14 60)` (≈ #D97706) available as `--ochre` for micro-details (badges, dates).

---

## 2. CategoryGrid — Mobile Swipeable Carousel (`category-grid.tsx`)

**Mobile (default):**
- Container: `flex overflow-x-auto gap-3 pb-3 snap-x snap-mandatory [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden`
- Each `CategoryCard`: `snap-start shrink-0 w-[140px]`

**Desktop (sm+):**
- Container: `sm:grid sm:grid-cols-3 sm:overflow-visible sm:flex-none lg:grid-cols-4 xl:grid-cols-5`
- Cards: `sm:w-auto`

Visual upgrades to CategoryCard:
- `rounded-2xl p-4 min-h-[120px]` 
- Hover: `hover:shadow-md hover:scale-[1.02] transition-all duration-300`
- Active state: `bg-primary text-primary-foreground` (deep green)
- Icon container: `size-12 rounded-xl bg-accent` (sage green)

---

## 3. JobDrawer — Bottom Sheet on Mobile (`job-drawer.tsx`)

Add `useIsMobile` hook (inline, no package):
```ts
function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)")
    setMobile(mq.matches)
    mq.addEventListener("change", e => setMobile(e.matches))
    return () => mq.removeEventListener("change", e => setMobile(e.matches))
  }, [])
  return mobile
}
```

Pass `side={isMobile ? "bottom" : "left"}` to `SheetContent`.

Mobile bottom sheet styles on `SheetContent`:
- `rounded-t-3xl max-h-[92dvh] w-full`
- Add drag handle indicator at top (decorative `div` 40x4px, rounded, bg-muted-foreground/30)

**Sticky Apply Bar** (inside Sheet, replaces current bottom `div`):
- `sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 z-10`
- Both buttons: `h-12` (48px touch target)

---

## 4. JobCard Visual Upgrade (`job-card.tsx`)

- Container: `rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300`
- Icon container: sage green `bg-accent` → stays; size `size-12 rounded-xl`
- Company/city text: charcoal muted
- Date line: ochre-tinted `text-xs` 
- `ChevronLeft`: animate `group-hover:-translate-x-1`

---

## 5. Hero Section (`public-view.tsx`)

- Background: `bg-gradient-to-b from-accent/30 to-background` (sage → off-white)
- Add subtle decorative blob: `absolute inset-0 pointer-events-none` SVG or `div` with radial gradient
- Headline: `text-foreground` (charcoal), accent word in `text-primary` (forest green)
- Search panel: `bg-card shadow-md rounded-2xl`

Header bar:
- Logo icon: `bg-primary` (forest green)  
- Nav links: `text-muted-foreground hover:text-foreground`

---

## 6. JobAlertsWidget (`job-alerts-widget.tsx`)

- Background: `bg-primary` → keep (deep forest green is perfect)
- BellRing icon container: `bg-primary-foreground/15`
- Text colors: `text-primary-foreground` and `text-primary-foreground/75`
- Form input: white background on green card for contrast

---

## 7. RoleSwitcher (`role-switcher.tsx`)

- Active tab: `bg-primary text-primary-foreground` (forest green, no change needed — CSS var update handles it)
- Container: `shadow-lg` with warm border

---

## 8. AdminView Bug Fixes (`admin-view.tsx`)

1. **Remove `j.views`** — `views` does not exist on `Job` type. Remove the "צפיות במשרות" stat card, replace with a "פניות ממתינות" metric using `applications.length`.
2. **Pass `setJobs` to CategoriesTab** — `admin-view.tsx:101` currently omits it; add `setJobs={setJobs}`.

---

## Files Changed

| File | Change |
|---|---|
| `app/globals.css` | Full palette + radius update |
| `components/job-board/category-grid.tsx` | Swipeable mobile carousel + visual polish |
| `components/job-board/job-drawer.tsx` | `useIsMobile` + `side` toggle + sticky apply bar |
| `components/job-board/job-card.tsx` | Visual polish (radius, hover, shadows) |
| `components/job-board/public-view.tsx` | Hero gradient + header styling |
| `components/job-board/job-alerts-widget.tsx` | Minor polish (contrast, spacing) |
| `components/job-board/role-switcher.tsx` | Picks up new CSS vars automatically |
| `components/job-board/admin-view.tsx` | Fix `j.views` bug + `setJobs` prop |

## Files NOT Changed

`lib/`, `components/ui/`, all `admin/` tab files, `apply-form-dialog.tsx`, `job-tags.tsx`.

---

## Out of Scope

- No new npm packages
- No dark mode changes
- No new routes or pages
- Admin tab logic (jobs-tab, categories-tab, applications-tab, settings-tab) — already functional
