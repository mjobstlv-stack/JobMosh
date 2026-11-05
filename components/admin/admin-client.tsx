"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { DEFAULT_SETTINGS, type Category, type Job, type GlobalSettings } from "@/lib/job-board-data"
import { AdminView } from "@/components/job-board/admin-view"
import { LoginGate, type AuthInfo } from "@/components/job-board/login-gate"
import { ExternalLink, Loader2, LogOut } from "lucide-react"
import type { AdminPermission } from "@/lib/admin-staff"
import { toast } from "sonner"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.jobmosh.co.il"

/** Persists a change; tells the admin when it did NOT save (e.g. expired session). */
async function postJson(url: string, body: unknown) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    })
    if (res.status === 401) {
      toast.error("פג תוקף ההתחברות — השינוי לא נשמר. יש להתחבר מחדש.")
    } else if (!res.ok) {
      toast.error("השמירה נכשלה — השינוי לא נשמר בשרת.")
    }
  } catch {
    toast.error("אין חיבור לשרת — השינוי לא נשמר.")
  }
}

/**
 * The admin panel shell, served only on ADMIN_HOST (see proxy.ts).
 * Data is fetched only after login — the jobs API returns private fields
 * (notification email) only to an authenticated admin, and the editor must
 * never save a list that was loaded without them.
 */
export function AdminClient() {
  const [authKey, setAuthKey] = useState(0)
  const [adminPermissions, setAdminPermissions] = useState<AdminPermission[] | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [jobs, setJobsState] = useState<Job[]>([])
  const [categories, setCategoriesState] = useState<Category[]>([])
  const [settings, setSettingsState] = useState<GlobalSettings>(DEFAULT_SETTINGS)

  const refreshData = useCallback(async (): Promise<boolean> => {
    const [jobsRes, catsRes, settingsRes] = await Promise.all([
      fetch("/api/jobs").catch(() => null),
      fetch("/api/categories").catch(() => null),
      fetch("/api/settings").catch(() => null),
    ])
    if (!jobsRes?.ok) return false
    const jobsData = await jobsRes.json().catch(() => null)
    if (!Array.isArray(jobsData)) return false
    setJobsState(jobsData)
    if (catsRes?.ok) {
      const data = await catsRes.json().catch(() => null)
      if (Array.isArray(data) && data.length > 0) setCategoriesState(data)
    }
    if (settingsRes?.ok) {
      const data = await settingsRes.json().catch(() => null)
      if (data && typeof data === "object") setSettingsState(data)
    }
    return true
  }, [])

  // Wrapped setters: update state AND persist to Blob immediately
  const setJobs = useCallback<React.Dispatch<React.SetStateAction<Job[]>>>((action) => {
    setJobsState((prev) => {
      const next = typeof action === "function" ? action(prev) : action
      postJson("/api/jobs", next)
      return next
    })
  }, [])

  const setCategories = useCallback<React.Dispatch<React.SetStateAction<Category[]>>>((action) => {
    setCategoriesState((prev) => {
      const next = typeof action === "function" ? action(prev) : action
      postJson("/api/categories", next)
      return next
    })
  }, [])

  // Settings can change per keystroke (nav labels) — debounce the save.
  const dirty = useRef(false)
  const setSettings = useCallback<React.Dispatch<React.SetStateAction<GlobalSettings>>>((action) => {
    dirty.current = true
    setSettingsState(action)
  }, [])
  useEffect(() => {
    if (!dirty.current) return
    const t = setTimeout(() => {
      dirty.current = false
      postJson("/api/settings", settings)
    }, 600)
    return () => clearTimeout(t)
  }, [settings])

  function handleAuth(info: AuthInfo) {
    setAdminPermissions(info.permissions)
    setLoadError(false)
    refreshData().then((ok) => (ok ? setLoaded(true) : setLoadError(true)))
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    setAdminPermissions(null)
    setLoaded(false)
    setJobsState([])
    setAuthKey((k) => k + 1) // remount LoginGate → shows the login form again
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Staff-only tool: no visitor cookie banner here */}
      <style>{"[data-cookie-notice]{display:none!important}"}</style>
      <LoginGate key={authKey} onAuth={handleAuth}>
        <div className="relative">
          <div className="fixed end-4 top-4 z-50 flex items-center gap-2">
            <a
              href={SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-foreground"
            >
              <ExternalLink className="size-3.5" />
              צפייה באתר
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-foreground"
            >
              <LogOut className="size-3.5" />
              התנתקות
            </button>
          </div>
          {!loaded ? (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
              {loadError ? (
                <>
                  <p>טעינת הנתונים נכשלה.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoadError(false)
                      refreshData().then((ok) => (ok ? setLoaded(true) : setLoadError(true)))
                    }}
                    className="rounded-full border border-border px-4 py-1.5 text-sm hover:text-foreground"
                  >
                    נסה שוב
                  </button>
                </>
              ) : (
                <>
                  <Loader2 className="size-6 animate-spin" />
                  <p className="text-sm">טוען נתונים…</p>
                </>
              )}
            </div>
          ) : (
          <AdminView
            jobs={jobs}
            setJobs={setJobs}
            categories={categories}
            setCategories={setCategories}
            settings={settings}
            setSettings={setSettings}
            permissions={adminPermissions}
            onRefresh={async () => { await refreshData() }}
          />
          )}
        </div>
      </LoginGate>
    </div>
  )
}
