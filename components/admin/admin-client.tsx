"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Category, Job, GlobalSettings } from "@/lib/job-board-data"
import { AdminView } from "@/components/job-board/admin-view"
import { LoginGate, type AuthInfo } from "@/components/job-board/login-gate"
import { ExternalLink, LogOut } from "lucide-react"
import type { AdminPermission } from "@/lib/admin-staff"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.jobmosh.co.il"

function postJson(url: string, body: unknown) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  }).catch(console.error)
}

/** The admin panel shell, served only on ADMIN_HOST (see proxy.ts). */
export function AdminClient({
  initialJobs,
  initialCategories,
  initialSettings,
}: {
  initialJobs: Job[]
  initialCategories: Category[]
  initialSettings: GlobalSettings
}) {
  const [authKey, setAuthKey] = useState(0)
  const [adminPermissions, setAdminPermissions] = useState<AdminPermission[] | null>(null)
  const [jobs, setJobsState] = useState<Job[]>(initialJobs)
  const [categories, setCategoriesState] = useState<Category[]>(initialCategories)
  const [settings, setSettingsState] = useState<GlobalSettings>(initialSettings)

  const refreshData = useCallback(async () => {
    const [jobsRes, catsRes, settingsRes] = await Promise.all([
      fetch("/api/jobs").catch(() => null),
      fetch("/api/categories").catch(() => null),
      fetch("/api/settings").catch(() => null),
    ])
    if (jobsRes?.ok) {
      const data = await jobsRes.json().catch(() => null)
      if (Array.isArray(data) && data.length > 0) setJobsState(data)
    }
    if (catsRes?.ok) {
      const data = await catsRes.json().catch(() => null)
      if (Array.isArray(data) && data.length > 0) setCategoriesState(data)
    }
    if (settingsRes?.ok) {
      const data = await settingsRes.json().catch(() => null)
      if (data && typeof data === "object") setSettingsState(data)
    }
  }, [])

  useEffect(() => { refreshData() }, [refreshData])

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
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    setAdminPermissions(null)
    setAuthKey((k) => k + 1) // remount LoginGate → shows the login form again
  }

  return (
    <div className="min-h-screen bg-background">
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
          <AdminView
            jobs={jobs}
            setJobs={setJobs}
            categories={categories}
            setCategories={setCategories}
            settings={settings}
            setSettings={setSettings}
            permissions={adminPermissions}
            onRefresh={refreshData}
          />
        </div>
      </LoginGate>
    </div>
  )
}
