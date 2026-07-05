# Salary Field — Design Spec
Date: 2026-07-04

## Goal

Add a structured salary field to job listings to improve Google for Jobs SEO ranking via `baseSalary` Schema.org data, and to show salary information to job seekers in both the job list and job detail page.

## Data Model

Add an optional `salary` field to the existing `Job` type in `lib/job-board-data.ts`:

```typescript
export type SalaryPeriod = 'HOUR' | 'MONTH'

export type Salary =
  | { type: 'range';       min: number; max: number; period: SalaryPeriod }
  | { type: 'minimum';     min: number;              period: SalaryPeriod }
  | { type: 'undisclosed'                                                  }
```

The `Job` type gains one new optional field:
```typescript
salary?: Salary
```

Currency is always ILS (₪). No multi-currency support needed.

## Display Logic

A shared helper `formatSalary(salary: Salary): string` lives in `lib/utils.ts`:

| type | output example |
|------|---------------|
| `range` | `8,000–12,000 ₪ לחודש` |
| `minimum` | `מ-8,000 ₪ לחודש` |
| `undisclosed` | `לפי ניסיון` |

Period labels (Hebrew):
- `HOUR` → לשעה
- `MONTH` → לחודש

Numbers are formatted with `toLocaleString('he-IL')`.

## Display Locations

**Job card (list view)** — `components/job-board/job-card.tsx`
Show salary below the existing tags row, using a small `₪` icon + formatted string. If `salary` is undefined, render nothing.

**Job detail page** — `app/jobs/[id]/page.tsx`
Show salary in the sticky sidebar above the apply buttons, with a label "שכר". If `salary` is undefined, render nothing.

## Schema.org (SEO)

When `salary` is present and not `undisclosed`, add `baseSalary` to the existing `jsonLd` object:

```json
"baseSalary": {
  "@type": "MonetaryAmount",
  "currency": "ILS",
  "value": {
    "@type": "QuantitativeValue",
    "minValue": 8000,       // range / minimum
    "maxValue": 12000,      // range only
    "unitText": "MONTH"     // HOUR | MONTH
  }
}
```

For `undisclosed`, no `baseSalary` is emitted.

## Seed Data

Update 3–5 entries in `INITIAL_JOBS` in `lib/job-board-data.ts` with sample salary values covering all three types, to demonstrate the feature visually.

## Out of Scope

- Admin UI for entering salary (existing admin flow is out of scope for this spec)
- Salary filtering/sorting (future)
- Multi-currency
