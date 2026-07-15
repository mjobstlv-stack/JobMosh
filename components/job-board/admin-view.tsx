"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
  BriefcaseIcon,
  LayoutGridIcon,
  InboxIcon,
  SettingsIcon,
  TrendingUpIcon,
  Pencil,
  MenuIcon,
  Users,
  RefreshCw,
} from "lucide-react"
import { JobsTab } from "@/components/job-board/admin/jobs-tab"
import { CategoriesTab } from "@/components/job-board/admin/categories-tab"
import { ApplicationsTab } from "@/components/job-board/admin/applications-tab"
import { SettingsTab } from "@/components/job-board/admin/settings-tab"
import { NavTab } from "@/components/job-board/admin/nav-tab"
import { UsersTab } from "@/components/job-board/admin/users-tab"
import { StaffTab } from "@/components/job-board/admin/staff-tab"
import type { Category, Job, Application, GlobalSettings } from "@/lib/job-board-data"
import type { AdminPermission } from "@/lib/admin-staff"

type Props = {
  jobs: Job[]
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>
  categories: Category[]
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>
  settings: GlobalSettings
  setSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>
  /** null = superadmin (all tabs visible); array = staff with these permissions only */
  permissions: AdminPermission[] | null
  onRefresh: () => Promise<void>
}

export function AdminView({
  jobs,
  setJobs,
  categories,
  setCategories,
  settings,
  setSettings,
  permissions,
  onRefresh,
}: Props) {
  const can = (p: AdminPermission) => permissions === null || permissions.includes(p)
  const [activeTab, setActiveTab] = useState("jobs")
  const [filterJobId, setFilterJobId] = useState<string | null>(null)
  const [filterJobTitle, setFilterJobTitle] = useState<string | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchApplications = useCallback(() => {
    setAppsLoading(true)
    fetch("/api/applications", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setApplications(Array.isArray(data) ? data : []))
      .catch(() => setApplications([]))
      .finally(() => setAppsLoading(false))
  }, [])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  async function handleRefresh() {
    setRefreshing(true)
    await Promise.all([onRefresh(), new Promise<void>((r) => { fetchApplications(); r() })])
    setRefreshing(false)
  }

  function handleFilterByJob(jobId: string, jobTitle: string) {
    setFilterJobId(jobId)
    setFilterJobTitle(jobTitle)
    setActiveTab("applications")
  }

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((j) => j.status === "active").length
    const draftJobs = jobs.filter((j) => j.status === "draft").length
    return [
      { label: "משרות פעילות", value: activeJobs, icon: BriefcaseIcon },
      { label: "קטגוריות", value: categories.length, icon: LayoutGridIcon },
      { label: "פניות שהתקבלו", value: applications.length, icon: InboxIcon },
      { label: "טיוטות", value: draftJobs, icon: Pencil },
    ]
  }, [jobs, categories, applications])

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
      <header className="mb-8">
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-primary">
          <TrendingUpIcon className="size-4" />
          ניהול מערכת
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-pretty text-3xl font-bold tracking-tight">לוח בקרה</h1>
            <p className="mt-1 text-muted-foreground">ניהול משרות, קטגוריות ופניות מועמדים במקום אחד</p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            title="רענן נתונים"
            className="mt-1 flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            רענן
          </button>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-2xl shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <stat.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
                <div className="truncate text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1">
          {can("jobs") && (
            <TabsTrigger value="jobs">
              <BriefcaseIcon data-icon="inline-start" />
              משרות
            </TabsTrigger>
          )}
          {can("categories") && (
            <TabsTrigger value="categories">
              <LayoutGridIcon data-icon="inline-start" />
              קטגוריות
            </TabsTrigger>
          )}
          {can("applications") && (
            <TabsTrigger value="applications">
              <InboxIcon data-icon="inline-start" />
              פניות
            </TabsTrigger>
          )}
          {can("settings") && (
            <TabsTrigger value="settings">
              <SettingsIcon data-icon="inline-start" />
              הגדרות
            </TabsTrigger>
          )}
          {can("nav") && (
            <TabsTrigger value="nav">
              <MenuIcon data-icon="inline-start" />
              תפריט
            </TabsTrigger>
          )}
          {can("users") && (
            <TabsTrigger value="users">
              <Users data-icon="inline-start" />
              משתמשים
            </TabsTrigger>
          )}
          {permissions === null && (
            <TabsTrigger value="staff">
              <Users data-icon="inline-start" />
              ניהול צוות
            </TabsTrigger>
          )}
        </TabsList>

        {can("jobs") && (
          <TabsContent value="jobs">
            <JobsTab
              jobs={jobs}
              setJobs={setJobs}
              categories={categories}
              applications={applications}
              onFilterByJob={handleFilterByJob}
            />
          </TabsContent>
        )}
        {can("categories") && (
          <TabsContent value="categories">
            <CategoriesTab
              categories={categories}
              setCategories={setCategories}
              jobs={jobs}
              setJobs={setJobs}
            />
          </TabsContent>
        )}
        {can("applications") && (
          <TabsContent value="applications">
            <ApplicationsTab
              applications={applications}
              loading={appsLoading}
              onRefresh={fetchApplications}
              filterJobId={filterJobId}
              filterJobTitle={filterJobTitle}
              onClearFilter={() => {
                setFilterJobId(null)
                setFilterJobTitle(null)
              }}
            />
          </TabsContent>
        )}
        {can("settings") && (
          <TabsContent value="settings">
            <SettingsTab settings={settings} setSettings={setSettings} />
          </TabsContent>
        )}
        {can("nav") && (
          <TabsContent value="nav">
            <NavTab settings={settings} setSettings={setSettings} />
          </TabsContent>
        )}
        {can("users") && (
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
        )}
        {permissions === null && (
          <TabsContent value="staff">
            <StaffTab />
          </TabsContent>
        )}
      </Tabs>
    </main>
  )
}
