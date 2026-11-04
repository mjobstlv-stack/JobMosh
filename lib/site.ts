// Single source of truth for the public site origin.
// The live domain redirects jobmosh.co.il → www.jobmosh.co.il, so canonical URLs,
// the sitemap and structured data must always use the www host — otherwise Google
// gets canonicals that point at redirects. A bare-domain env value is normalized here.
const RAW_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jobmosh.co.il"

export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, "").replace(
  /^https?:\/\/jobmosh\.co\.il$/i,
  "https://www.jobmosh.co.il",
)

export const SITE_NAME = "ג'וב מוש"

/** Google Analytics 4 measurement ID (GA → Admin → Data streams). */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-65FXV5VPRF"

/** localStorage key holding the visitor's analytics choice: JSON "granted" | "denied". */
export const ANALYTICS_CONSENT_KEY = "jm_analytics_consent"
