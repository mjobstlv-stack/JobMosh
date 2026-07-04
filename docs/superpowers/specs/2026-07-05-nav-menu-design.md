# Nav Menu — Dynamic Navigation Design Spec
Date: 2026-07-05

## Goal

Allow the admin to show/hide each nav link and customize its label. "משרות" scrolls to the jobs section. "חברות" and "ייעוץ קריירה" scroll to anchors that will be filled in future phases (B and C).

## GlobalSettings Changes

Add 6 fields to `GlobalSettings` in `lib/job-board-data.ts`:

```typescript
export type GlobalSettings = {
  jobAlertsEnabled: boolean
  navJobsVisible: boolean      // default: true
  navJobsLabel: string         // default: "משרות"
  navCompaniesVisible: boolean // default: false
  navCompaniesLabel: string    // default: "חברות"
  navCareersVisible: boolean   // default: false
  navCareersLabel: string      // default: "ייעוץ קריירה"
}
```

Update `INITIAL_SETTINGS` (used as default in `usePersistedState`) to include these defaults.

## Public Nav Changes (`components/job-board/public-view.tsx`)

The nav row currently renders static `<span>` elements. Replace with dynamic rendering:

- Only render a link if its `visible` flag is `true`
- Display the label from settings (fall back to Hebrew default if empty string)
- "משרות" link: `onClick` calls `document.getElementById("jobs-section")?.scrollIntoView({ behavior: "smooth" })`
- "חברות" link: scrolls to `id="companies-section"` (anchor added to public view, empty div for now)
- "ייעוץ קריירה" link: scrolls to `id="careers-section"` (anchor added to public view, empty div for now)

Add `id="jobs-section"` to the existing `<section aria-labelledby="jobs-heading">` element.

Add two empty anchor divs at the bottom of `<main>` (before `</main>`):
```tsx
<div id="companies-section" />
<div id="careers-section" />
```

## Admin — New "תפריט" Tab

Add a new tab `value="nav"` to `AdminView` in `components/job-board/admin-view.tsx`:

```tsx
<TabsTrigger value="nav">
  <MenuIcon data-icon="inline-start" />
  תפריט
</TabsTrigger>
```

Create `components/job-board/admin/nav-tab.tsx`:

Each of the 3 nav items is rendered as a row:
```
[Switch on/off]  [Label input field]
```

- Switch controls `navJobsVisible` / `navCompaniesVisible` / `navCareersVisible`
- Input controls `navJobsLabel` / `navCompaniesLabel` / `navCareersLabel`
- Input placeholder shows the Hebrew default ("משרות", "חברות", "ייעוץ קריירה")
- Changes are saved immediately to `settings` via `setSettings`
- A single "שמירת שינויים" button at the bottom shows a success toast

## Data Persistence

No new persistence mechanism needed. `GlobalSettings` is already persisted via `usePersistedState("jm_settings", ...)` in `app/page.tsx`. The new fields will be included with their defaults on first load.

## Out of Scope

- Reordering nav links
- Adding custom links beyond the 3 predefined ones
- Mobile hamburger menu (nav is already hidden on mobile with `hidden sm:flex`)
- Actual content for "חברות" and "ייעוץ קריירה" sections (phases B and C)
