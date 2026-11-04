/**
 * Thin wrapper around gtag for custom GA4 events.
 *
 * Never pass personal data (name, email, phone, CV) as a parameter — GA4 terms
 * forbid PII, and nothing here needs it. Calls are no-ops when gtag is missing
 * (dev builds) and respect Consent Mode: without consent GA only receives
 * cookieless pings.
 */

import { GA_MEASUREMENT_ID } from "@/lib/site"

/** localStorage flag that marks this browser as the site owner's / staff's own traffic. */
export const INTERNAL_TRAFFIC_KEY = "jm_internal"

/** Names of the events tracked across the site — mark the starred ones as key events in GA. */
export type AnalyticsEvent =
  | "generate_lead" // ★ application form submitted successfully
  | "whatsapp_click" // ★ "apply via WhatsApp" link clicked
  | "employer_contact" // ★ employer clicked "publish a job" (mailto)
  | "sign_up" // ★ candidate account created
  | "job_alert_signup" // job-alerts widget submitted
  | "login"
  | "contact_email"
  | "phone_click"

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
