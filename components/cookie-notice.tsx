"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Cookie, X } from "lucide-react"
import { usePersistedState } from "@/hooks/use-persisted-state"
import { ANALYTICS_CONSENT_KEY } from "@/lib/site"

type Consent = "granted" | "denied" | null

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/** Removes Google Analytics cookies (_ga, _ga_<id>) on every domain variant they may be set on. */
function deleteAnalyticsCookies() {
  const names = document.cookie
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter((n) => n === "_ga" || n.startsWith("_ga_"))
  const host = window.location.hostname
  const domains = ["", host, `.${host}`, `.${host.replace(/^www\./, "")}`]
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; max-age=0; path=/${domain ? `; domain=${domain}` : ""}`
    }
  }
}

/**
 * Pushes the visitor's choice to Google Consent Mode v2. Only analytics is ever
 * granted — the site runs no ads, so the three ad signals always stay denied.
 */
function applyConsent(choice: "granted" | "denied") {
  window.gtag?.("consent", "update", {
    analytics_storage: choice,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  })
  if (choice === "denied") deleteAnalyticsCookies()
}

/** Withdraws consent, clears the stored choice and reloads so the notice asks again. */
export function resetCookieConsent() {
  applyConsent("denied")
  try {
    localStorage.removeItem(ANALYTICS_CONSENT_KEY)
  } catch {}
  window.location.reload()
}

export function CookieNotice() {
  const [mounted, setMounted] = useState(false)
  const [consent, setConsent] = usePersistedState<Consent>(ANALYTICS_CONSENT_KEY, null)

  useEffect(() => setMounted(true), [])

  if (!mounted || consent !== null) return null

  function accept() {
    setConsent("granted")
    applyConsent("granted")
  }

  function decline() {
    setConsent("denied")
    applyConsent("denied")
  }

  return (
    <div
      className="fixed bottom-5 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-card p-4 shadow-2xl"
      dir="rtl"
      role="dialog"
      aria-label="הסכמה לשימוש בעוגיות"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Cookie className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">שימוש בעוגיות</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            האתר משתמש בעוגיות חיוניות לתפעול, ובאישורך גם ב-Google Analytics למדידת השימוש
            באתר ולשיפורו. פרטים נוספים{" "}
            <Link href="/privacy" className="text-primary underline">
              במדיניות הפרטיות
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={decline}
          className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="סגירה (רק עוגיות חיוניות)"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={accept}
          className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          מאשר/ת
        </button>
        <button
          type="button"
          onClick={decline}
          className="flex-1 rounded-xl border border-border bg-card py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          רק חיוניות
        </button>
      </div>
    </div>
  )
}
