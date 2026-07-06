"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ApplyFormContent } from "@/components/job-board/apply-form-content"
import type { Application, Job } from "@/lib/job-board-data"
import type { PublicUser } from "@/lib/user-types"

export function ApplyFormDialog({
  job,
  open,
  onOpenChange,
  onSuccess,
  currentUser,
}: {
  job: Job | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (app: Application) => void
  currentUser?: PublicUser | null
}) {
  if (!job) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>הגשת מועמדות</DialogTitle>
          <DialogDescription>
            למשרת {job.title} · {job.company}
          </DialogDescription>
        </DialogHeader>
        <ApplyFormContent
          key={job.id}
          job={job}
          currentUser={currentUser}
          onSuccess={(app) => { onSuccess(app); onOpenChange(false) }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
