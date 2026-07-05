"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { JobFormDialog } from "@/components/job-board/admin/job-form-dialog"
import {
  JOB_STATUS_LABELS,
  type Category,
  type Job,
  type JobStatus,
} from "@/lib/job-board-data"
import { Plus, Pencil, Trash2, Send, MessageCircle, Users, Copy } from "lucide-react"
import type { Application } from "@/lib/job-board-data"

const STATUS_VARIANT: Record<
  JobStatus,
  "default" | "secondary" | "outline"
> = {
  active: "default",
  draft: "secondary",
  archived: "outline",
}

export function JobsTab({
  jobs,
  setJobs,
  categories,
  applications,
  onFilterByJob,
}: {
  jobs: Job[]
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>
  categories: Category[]
  applications: Application[]
  onFilterByJob: (jobId: string, jobTitle: string) => void
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)

  function handleSave(job: Job) {
    setJobs((prev) => {
      const exists = prev.some((j) => j.id === job.id)
      return exists ? prev.map((j) => (j.id === job.id ? job : j)) : [job, ...prev]
    })
  }

  function handleDelete(id: string) {
    setJobs((prev) => prev.filter((j) => j.id !== id))
    toast.success("המשרה נמחקה")
  }

  function handleDuplicate(job: Job) {
    const copy: Job = {
      ...job,
      id: `job-${Date.now()}`,
      title: `${job.title} (עותק)`,
      status: "draft",
    }
    setJobs((prev) => [copy, ...prev])
    toast.success("המשרה שוכפלה — נפתחה כטיוטה")
  }

  function toggleChannel(id: string, key: "allowSiteApply" | "allowWhatsApp") {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, [key]: !j[key] } : j)),
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>ניהול משרות</CardTitle>
          <CardDescription>
            סך הכל {jobs.length} משרות במערכת
          </CardDescription>
        </div>
        <Button
          onClick={() => {
            setEditingJob(null)
            setDialogOpen(true)
          }}
        >
          <Plus data-icon="inline-start" />
          הוספת משרה חדשה
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">משרה</TableHead>
                <TableHead className="text-right">אזור</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">מועמדים</TableHead>
                <TableHead className="text-right">ערוצי הגשה</TableHead>
                <TableHead className="text-left">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {job.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {job.company}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {job.region}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[job.status]}>
                      {JOB_STATUS_LABELS[job.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const count = applications.filter((a) => a.jobId === job.id).length
                      return count > 0 ? (
                        <button
                          onClick={() => onFilterByJob(job.id, job.title)}
                          className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                        >
                          <Users className="size-3" />
                          {count}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Switch
                          checked={job.allowSiteApply}
                          onCheckedChange={() =>
                            toggleChannel(job.id, "allowSiteApply")
                          }
                        />
                        <Send className="size-3.5" />
                        טופס
                      </label>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Switch
                          checked={job.allowWhatsApp}
                          onCheckedChange={() =>
                            toggleChannel(job.id, "allowWhatsApp")
                          }
                        />
                        <MessageCircle className="size-3.5" />
                        וואטסאפ
                      </label>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="עריכה"
                        onClick={() => {
                          setEditingJob(job)
                          setDialogOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="שכפול"
                        onClick={() => handleDuplicate(job)}
                      >
                        <Copy />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="מחיקה"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(job.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <JobFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingJob={editingJob}
        categories={categories}
        onSave={handleSave}
      />
    </Card>
  )
}
