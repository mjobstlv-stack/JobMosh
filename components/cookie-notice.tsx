"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Cookie, X } from "lucide-react"
import { usePersistedState } from "@/hooks/use-persisted-state"

const STORAGE_KEY = "jm_cookie_notice_dismissed"

export function CookieNotice() {
  const [mounted, setMounted] = useState(false)
  const [dismissed, setDismissed] = usePersistedState<boolean>(STORAGE_KEY, false)

  useEffect(() => setMounted(true), [])

  if (!mounted || dismissed) return null

  return (
    <div
      className="fixed bottom-5 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-card p-4 shadow-2xl"
      dir="rtl"
      role="dialog"
      aria-label="הודעה בדבר שימוש בעוגיות"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Cookie className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">שימוש בעוגיות</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            האתר משתמש ב-localStorage ובעוגיות חיוניות לתפעול בסיסי, וכן בשירות
            אנליטיקס אנונימי לשיפור האתר. פרטים נוספים{" "}
            <Link href="/privacy" className="text-primary underline">
              במדיניות הפרטיות
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="סגור הודעה"
        >
          <X className="size-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="mt-3 w-full rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        הבנתי
      </button>
    </div>
  )
}
