"use client"

import { resetCookieConsent } from "@/components/cookie-notice"

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={resetCookieConsent}
      className="mt-3 rounded-lg border border-border px-3 py-1.5 text-sm text-primary transition-colors hover:bg-muted"
    >
      שינוי הגדרות עוגיות
    </button>
  )
}
