"use client"

import { useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
  BriefcaseIcon,
  LayoutGridIcon,
  InboxIcon,
  SettingsIcon,
  TrendingUpIcon,
  EyeIcon,
} from "lucide-react"
import { JobsTab } from "@/components/job-board/admin/jobs-tab"
import { CategoriesTab } from "@/components/job-board/admin/categories-tab"
import { ApplicationsTab } from "@/components/job-board/admin/applications-tab"
import { SettingsTab } from "@/components/job-board/admin/settings-tab"
import type { Category, Job, Application, GlobalSettings } from "@/lib/job-board-data"

type Props = {
  jobs: Job[]
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>
  categories: Category[]
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>
  applications: Application[]
  settings: GlobalSettings
  setSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>
}

export function AdminView({
  jobs,
  setJobs,
  categories,
  setCategories,
  applications,
  settings,
  setSettings,
}: Props) {
  const stats = useMemo(() => {
    const activeJobs = jobs.filter((j) => j.status === "active").length
    const totalViews = jobs.reduce((sum, j) => sum + j.views, 0)
    return [
      { label: "משרות פעילות", value: activeJobs, icon: BriefcaseIcon },
      { label: "קטגוריות", value: categories.length, icon: LayoutGridIcon },
      { label: "פניות שהתקבלו", value: applications.length, icon: InboxIcon },
      { label: "צפיות במשרות", value: totalViews.toLocaleString("he-IL"), icon: EyeIcon },
    ]
  }, [jobs, categories, applications])

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
      <header className="mb-8">
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-primary">
          <TrendingUpIcon className="size-4" />
          ניהול מערכת
        </div>
        <h1 className="text-pretty text-3xl font-bold tracking-tight">לוח בקרה</h1>
        <p className="mt-1 text-muted-foreground">ניהול משרות, קטגוריות ופניות מועמדים במקום אחד</p>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
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

      <Tabs defaultValue="jobs">
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="jobs">
            <BriefcaseIcon data-icon="inline-start" />
            משרות
          </TabsTrigger>
          <TabsTrigger value="categories">
            <LayoutGridIcon data-icon="inline-start" />
            קטגוריות
          </TabsTrigger>
          <TabsTrigger value="applications">
            <InboxIcon data-icon="inline-start" />
            פניות
          </TabsTrigger>
          <TabsTrigger value="settings">
            <SettingsIcon data-icon="inline-start" />
            הגדרות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <JobsTab jobs={jobs} setJobs={setJobs} categories={categories} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab categories={categories} setCategories={setCategories} jobs={jobs} />
        </TabsContent>
        <TabsContent value="applications">
          <ApplicationsTab applications={applications} jobs={jobs} />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab settings={settings} setSettings={setSettings} />
        </TabsContent>
      </Tabs>
    </main>
  )
}
