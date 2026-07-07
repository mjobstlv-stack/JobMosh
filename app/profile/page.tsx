"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { AccountForm } from "@/components/user/account-form"
import { ProfileManager } from "@/components/user/profile-manager"
import { ApplicationHistory } from "@/components/user/application-history"
import type { PublicUser } from "@/lib/user-types"
import type { Job } from "@/lib/job-board-data"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<PublicUser | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/user/me").then(r => r.ok ? r.json() : null),
      fetch("/api/jobs").then(r => r.json()).catch(() => []),
    ]).then(([userData, jobsData]) => {
      if (!userData) { router.push("/"); setLoading(false); return }
      setUser(userData)
      setJobs(Array.isArray(jobsData) ? jobsData : [])
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="text-muted-foreground">טוען...</span>
    </div>
  )
  if (!user) return null

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ChevronRight className="size-4" />חזרה לדף הבית
          </Link>
          <Link href="/" className="font-heading text-base font-extrabold text-foreground">
            ג&apos;וב<span className="text-primary">מוש</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        <AccountForm user={user} onUpdate={setUser} />
        <ProfileManager user={user} onUpdate={setUser} />
        <ApplicationHistory applications={user.applications} jobs={jobs} />
      </main>
    </div>
  )
}
