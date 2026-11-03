// SEO landing pages: "דרושים ב<עיר>" and "דרושים ב<תחום>".
// Built from the live jobs, so a page exists only while it has open jobs.
import type { Category, Job } from "@/lib/job-board-data"

/** Pages with fewer open jobs than this are rendered but kept out of Google (noindex) and the sitemap. */
export const MIN_JOBS_TO_INDEX = 2

// Spellings the admin has typed for the same city → one canonical Hebrew name.
const CITY_ALIASES: Record<string, string> = {
  "tel aviv": "תל אביב",
  "tel-aviv": "תל אביב",
  "תל-אביב": "תל אביב",
  "ת״א": "תל אביב",
  'ת"א': "תל אביב",
  "פתח-תקווה": "פתח תקווה",
  "פתח תקוה": "פתח תקווה",
}

export function normalizeCity(city: string): string {
  const clean = city.trim().replace(/[\s,.;·|]+$/, "").replace(/\s+/g, " ")
  return CITY_ALIASES[clean.toLowerCase()] ?? CITY_ALIASES[clean] ?? clean
}

/** "פתח תקווה" → "פתח-תקווה", "עיצוב ו-UI/UX" → "עיצוב-ו-UIUX" (Hebrew stays readable in Google). */
export function toSlug(text: string): string {
  return text
    .trim()
    .replace(/["'״׳/\\?#%&+]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

/** Route params for non-ASCII segments may arrive percent-encoded. */
export function decodeSlug(param: string): string {
  try {
    return decodeURIComponent(param)
  } catch {
    return param
  }
}

const newestFirst = (a: Job, b: Job) => b.postedAt.localeCompare(a.postedAt)

export type CityPage = { slug: string; name: string; jobs: Job[] }
export type CategoryPage = { slug: string; category: Category; jobs: Job[] }

export function getActiveJobs(jobs: Job[]): Job[] {
  return jobs.filter((j) => j.status === "active").sort(newestFirst)
}

export function getCityPages(jobs: Job[]): CityPage[] {
  const map = new Map<string, CityPage>()
  for (const job of getActiveJobs(jobs)) {
    if (!job.city?.trim() || job.workModel === "מהבית") continue
    const name = normalizeCity(job.city)
    const slug = toSlug(name)
    if (!slug) continue
    const page = map.get(slug) ?? { slug, name, jobs: [] }
    page.jobs.push(job)
    map.set(slug, page)
  }
  return [...map.values()].sort((a, b) => b.jobs.length - a.jobs.length || a.name.localeCompare(b.name, "he"))
}

export function getCategoryPages(jobs: Job[], categories: Category[]): CategoryPage[] {
  const active = getActiveJobs(jobs)
  return categories
    .map((category) => ({
      slug: toSlug(category.name),
      category,
      jobs: active.filter((j) => j.categoryIds.includes(category.id)),
    }))
    .filter((p) => p.slug && p.jobs.length > 0)
    .sort((a, b) => b.jobs.length - a.jobs.length)
}

export function cityUrl(slug: string): string {
  return `/jobs/city/${slug}`
}

export function categoryUrl(slug: string): string {
  return `/jobs/category/${slug}`
}

/** "משרה אחת" / "2 משרות" */
export function jobsCountLabel(n: number): string {
  return n === 1 ? "משרה אחת" : `${n} משרות`
}

/** "משרה אחת פתוחה" / "2 משרות פתוחות" */
export function openJobsLabel(n: number): string {
  return n === 1 ? "משרה אחת פתוחה" : `${n} משרות פתוחות`
}
