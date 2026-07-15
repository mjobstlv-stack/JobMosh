"use client"

import { useState, useEffect } from "react"
import { Send } from "lucide-react"
import { ApplyFormDialog } from "@/components/job-board/apply-form-dialog"
import type { Job } from "@/lib/job-board-data"
import type { PublicUser } from "@/lib/user-types"

export function ApplyButton({ job }: { job: Job }) {
  const [open, setOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null)

  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => setCurrentUser(u))
      .catch(() => {})
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
      >
        <Send className="size-4" />
        הגש מועמדות באתר
      </button>
      <ApplyFormDialog
        job={job}
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {}}
        currentUser={currentUser}
      />
    </>
  )
}
