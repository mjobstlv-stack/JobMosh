"use client"

import { useCallback, useEffect, useState } from "react"
import {
  INITIAL_CATEGORIES,
  INITIAL_JOBS,
  type Category,
  type Job,
  type Application,
  type GlobalSettings,
} from "@/lib/job-board-data"
import { PublicView } from "@/components/job-board/public-view"
import { AdminView } from "@/components/job-board/admin-view"
import { LoginGate, type AuthInfo } from "@/components/job-board/login-gate"
import { usePersistedState } from "@/hooks/use-persisted-state"
import { UserRound } from "lucide-react"
import type { AdminPermission } from "@/lib/admin-staff"

export default function Page() {
  const [role, setRole] = useState<"public" | "admin">("public")
  const [adminPermissions, setAdminPermissions] = useState<AdminPermission[] | null>(null)
  const [jobs, setJobsState] = useState<Job[]>(INITIAL_JOBS)
  const [categories, setCategoriesState] = useState<Category[]>(INITIAL_CATEGORIES)

  const [settings, setSettings] = usePersistedState<GlobalSettings>("jm_settings", {
    jobAlertsEnabled: true,
    navJobsVisible: true,
    navJobsLabel: "משרות",
    navCompaniesVisible: false,
    navCompaniesLabel: "חברות",
    navCareersVisible: false,
    navCareersLabel: "ייעוץ קריירה",
  })

  const refreshData = useCallback(async () => {
    const [jobsRes, catsRes] = await Promise.all([
      fetch("/api/jobs").catch(() => null),
      fetch("/api/categories").catch(() => null),
    ])
    if (jobsRes?.ok) {
      const data = await jobsRes.json().catch(() => null)
      if (Array.isArray(data) && data.length > 0) setJobsState(data)
    }
    if (catsRes?.ok) {
      const data = await catsRes.json().catch(() => null)
      if (Array.isArray(data) && data.length > 0) setCategoriesState(data)
    }
  }, [])

  // Load jobs + categories from Blob on every mount so all devices stay in sync
  useEffect(() => { refreshData() }, [refreshData])

  // Wrapped setters: update state AND persist to Blob immediately
  const setJobs = useCallback<React.Dispatch<React.SetStateAction<Job[]>>>((action) => {
    setJobsState((prev) => {
      const next = typeof action === "function" ? action(prev) : action
      fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(next),
      }).catch(console.error)
      return next
    })
  }, [])

  const setCategories = useCallback<React.Dispatch<React.SetStateAction<Category[]>>>((action) => {
    setCategoriesState((prev) => {
      const next = typeof action === "function" ? action(prev) : action
      fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(next),
      }).catch(console.error)
      return next
    })
  }, [])

  function handleAuth(info: AuthInfo) {
    setAdminPermissions(info.permissions)
  }

  async function handleSwitchToPublic() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    setRole("public")
    setAdminPermissions(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {role === "public" ? (
        <PublicView
          jobs={jobs}
          categories={categories}
          settings={settings}
          onSubmitApplication={(_app: Application) => {}}
          onSwitchToAdmin={() => setRole("admin")}
        />
      ) : (
        <LoginGate onBack={() => setRole("public")} onAuth={handleAuth}>
          <div className="relative">
            <button
              type="button"
              onClick={handleSwitchToPublic}
              className="fixed end-4 top-4 z-50 flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-foreground"
            >
              <UserRound className="size-3.5" />
              ממשק ציבורי
            </button>
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
      )}
    </div>
  )
}
