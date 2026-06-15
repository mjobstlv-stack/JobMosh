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
import { RoleSwitcher, type Role } from "@/components/job-board/role-switcher"
import { PublicView } from "@/components/job-board/public-view"
import { AdminView } from "@/components/job-board/admin-view"

export default function Page() {
  const [role, setRole] = useState<Role>("public")
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES)
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS)
  const [applications, setApplications] =
    useState<Application[]>(INITIAL_APPLICATIONS)
  const [settings, setSettings] = useState<GlobalSettings>({
    jobAlertsEnabled: true,
  })

  return (
    <div className="min-h-screen bg-background">
      <RoleSwitcher role={role} onChange={setRole} />

      {role === "public" ? (
        <PublicView
          jobs={jobs}
          categories={categories}
          settings={settings}
          onSubmitApplication={(app) =>
            setApplications((prev) => [app, ...prev])
          }
        />
      ) : (
        <AdminView
          jobs={jobs}
          setJobs={setJobs}
          categories={categories}
          setCategories={setCategories}
          applications={applications}
          settings={settings}
          setSettings={setSettings}
        />
      )}
    </div>
  )
}
