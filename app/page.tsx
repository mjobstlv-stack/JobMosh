"use client"

import { useState } from "react"
import {
  INITIAL_CATEGORIES,
  INITIAL_JOBS,
  INITIAL_APPLICATIONS,
  type Category,
  type Job,
  type Application,
  type GlobalSettings,
} from "@/lib/job-board-data"
import { PublicView } from "@/components/job-board/public-view"
import { AdminView } from "@/components/job-board/admin-view"
import { LoginGate } from "@/components/job-board/login-gate"
import { usePersistedState } from "@/hooks/use-persisted-state"
import { UserRound } from "lucide-react"

export default function Page() {
  const [role, setRole] = useState<"public" | "admin">("public")

  // Persisted across page refreshes via localStorage
  const [jobs, setJobs] = usePersistedState<Job[]>("jm_jobs", INITIAL_JOBS)
  const [categories, setCategories] = usePersistedState<Category[]>(
    "jm_categories",
    INITIAL_CATEGORIES,
  )
  const [applications, setApplications] = usePersistedState<Application[]>(
    "jm_applications",
    INITIAL_APPLICATIONS,
  )
  const [settings, setSettings] = usePersistedState<GlobalSettings>(
    "jm_settings",
    { jobAlertsEnabled: true },
  )

  async function handleSwitchToPublic() {
    // Invalidate session cookie server-side
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    setRole("public")
  }

  return (
    <div className="min-h-screen bg-background">
      {role === "public" ? (
        <PublicView
          jobs={jobs}
          categories={categories}
          settings={settings}
          onSubmitApplication={(app) =>
            setApplications((prev) => [app, ...prev])
          }
          onSwitchToAdmin={() => setRole("admin")}
        />
      ) : (
        <LoginGate>
          <div className="relative">
            <button
              type="button"
              onClick={handleSwitchToPublic}
              className="fixed start-4 top-4 z-50 flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-foreground"
            >
              <UserRound className="size-3.5" />
              ממשק ציבורי
            </button>
            <AdminView
              jobs={jobs}
              setJobs={setJobs}
              categories={categories}
              setCategories={setCategories}
              applications={applications}
              settings={settings}
              setSettings={setSettings}
            />
          </div>
        </LoginGate>
      )}
    </div>
  )
}
