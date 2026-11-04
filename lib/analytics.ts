/**
 * Thin wrapper around gtag for custom GA4 events.
 *
 * Never pass personal data (name, email, phone, CV) as a parameter — GA4 terms
 * forbid PII, and nothing here needs it. Calls are no-ops when gtag is missing
 * (dev builds) and respect Consent Mode: without consent GA only receives
 * cookieless pings.
 */

import { GA_MEASUREMENT_ID } from "@/lib/site"
import { CITY_REGION_MAP, type Category, type Job } from "@/lib/job-board-data"
import { normalizeCity } from "@/lib/landing-pages"

/** localStorage flag that marks this browser as the site owner's / staff's own traffic. */
export const INTERNAL_TRAFFIC_KEY = "jm_internal"

/** Names of the events tracked across the site — mark the starred ones as key events in GA. */
export type AnalyticsEvent =
  | "generate_lead" // ★ application form submitted successfully
  | "whatsapp_click" // ★ "apply via WhatsApp" link clicked
  | "employer_contact" // ★ employer clicked "publish a job" (mailto)
  | "sign_up" // ★ candidate account created
  | "job_alert_signup" // job-alerts widget submitted
  | "job_view" // job opened — drawer on the homepage, or the /jobs/[id] page (see view_source)
  | "apply_start" // application form opened (funnel step between job_view and generate_lead)
  | "search" // free-text job search (GA's recommended event; search_term param)
  | "filter_jobs" // region / job type / work model / category filters changed
  | "login"
  | "contact_email"
  | "phone_click"

/**
 * Recruitment dimensions. Register each of these in GA4 (Admin → Custom definitions →
 * event-scoped custom dimension, same parameter name) to slice every report by
 * job, area and field.
 */
export const JOB_DIMENSIONS = [
  "job_id",
  "job_title",
  "job_company",
  "job_city",
  "job_region",
  "job_category",
  "job_type",
  "work_model",
  "salary_listed",
] as const

// Category id → name, filled by whichever page has the category list, so events
// carry "הייטק" rather than "cat-tech" without threading categories through every component.
const categoryNames = new Map<string, string>()

export function registerCategories(categories: Category[]) {
  for (const c of categories) categoryNames.set(c.id, c.name)
}

/** The only job fields analytics reads — lets server pages pass a trimmed object to the client. */
export type AnalyticsJob = Pick<
  Job,
  "id" | "title" | "company" | "city" | "region" | "categoryIds" | "jobType" | "workModel" | "salary"
>

export function toAnalyticsJob(job: Job): AnalyticsJob {
  const { id, title, company, city, region, categoryIds, jobType, workModel, salary } = job
  return { id, title, company, city, region, categoryIds, jobType, workModel, salary }
}

/** Area of the job: the admin-picked region, or the region of its city for remote/unknown values. */
function jobRegion(job: AnalyticsJob): string {
  return job.region || CITY_REGION_MAP[job.city?.trim() ?? ""] || "לא צוין"
}

/** The standard parameter set every job-related event carries. Contains no personal data. */
type JobParams = Record<(typeof JOB_DIMENSIONS)[number], string>

// Last params per job id, so plain <a> links (handled by AnalyticsLinkTracker, which only
// knows the job id) can report the same dimensions as the job_view on that page.
const paramsCache = new Map<string, JobParams>()

export function cachedJobParams(jobId: string | undefined): JobParams | undefined {
  return jobId ? paramsCache.get(jobId) : undefined
}

export function jobParams(job: AnalyticsJob): JobParams {
  const cats = job.categoryIds.map((id) => categoryNames.get(id) ?? id)
  const params: JobParams = {
    job_id: job.id,
    job_title: job.title,
    job_company: job.company,
    job_city: job.workModel === "מהבית" ? "מהבית" : normalizeCity(job.city || "") || "לא צוין",
    job_region: jobRegion(job),
    // Primary field first; GA dimensions are single-valued, so extra fields are joined.
    job_category: cats.join(", ") || "ללא תחום",
    job_type: job.jobType,
    work_model: job.workModel,
    salary_listed: job.salary && job.salary.type !== "undisclosed" ? "yes" : "no",
  }
  paramsCache.set(job.id, params)
  return params
}

/** GA content group for a path — lets reports compare job pages vs. city / field landing pages. */
export function contentGroupFor(pathname: string): string {
  if (pathname === "/") return "home"
  if (pathname.startsWith("/jobs/city/")) return "landing_city"
  if (pathname.startsWith("/jobs/category/")) return "landing_category"
  if (pathname === "/jobs") return "jobs_index"
  if (pathname.startsWith("/jobs/")) return "job_page"
  if (pathname.startsWith("/profile")) return "profile"
  return "info"
}

export function trackEvent(name: AnalyticsEvent, params: Record<string, string | number | undefined> = {}) {
  if (typeof window === "undefined") return
  try {
    window.gtag?.("event", name, params)
  } catch {
    // Analytics must never break the UI.
  }
}

/**
 * Excludes this browser from GA from now on (used after an admin/staff login),
 * so the owner's own visits don't inflate the numbers.
 */
export function markInternalTraffic() {
  try {
    localStorage.setItem(INTERNAL_TRAFFIC_KEY, "1")
  } catch {
    // Storage blocked — nothing to persist.
  }
  // Also stop GA for the rest of this page session, not only from the next load.
  ;(window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = true
}
