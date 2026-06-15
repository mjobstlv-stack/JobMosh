"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { JobTags } from "@/components/job-board/job-tags"
import { ApplyFormDialog } from "@/components/job-board/apply-form-dialog"
import { getCategoryIcon } from "@/lib/category-icons"
import {
  formatHebrewDate,
  type Application,
  type Category,
  type Job,
} from "@/lib/job-board-data"
import {
  CheckCircle2,
  FileText,
  MapPin,
  MessageCircle,
  Send,
} from "lucide-react"

export function JobDrawer({
  job,
  categories,
  onOpenChange,
  onSubmitApplication,
}: {
  job: Job | null
  categories: Category[]
  onOpenChange: (open: boolean) => void
  onSubmitApplication: (app: Application) => void
}) {
  const [applyOpen, setApplyOpen] = useState(false)

  function handleWhatsApp() {
    if (!job) return
    const template = `היי, אני מעוניין/ת להגיש מועמדות למשרת ${job.title} באזור ${job.region} שפורסמה באתר שלך. אשמח לקבל פרטים נוספים.`
    const url = `https://wa.me/${job.whatsappNumber}?text=${encodeURIComponent(template)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const jobCats = job
    ? categories.filter((c) => job.categoryIds.includes(c.id))
    : []

  return (
    <>
      <Sheet open={!!job} onOpenChange={onOpenChange}>
        <SheetContent
          side="left"
          className="w-full gap-0 p-0 sm:max-w-lg"
        >
          {job && (
            <>
              <SheetHeader className="border-b border-border p-6">
                <div className="flex items-start gap-4">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    {(() => {
                      const Icon = getCategoryIcon(
                        jobCats[0]?.icon ?? "briefcase",
                      )
                      return <Icon className="size-7" />
                    })()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-xl leading-tight">
                      {job.title}
                    </SheetTitle>
                    <SheetDescription className="mt-1 flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {job.company} · {job.city}
                    </SheetDescription>
                  </div>
                </div>
                <div className="mt-4">
                  <JobTags job={job} />
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-6 p-6">
                  <section>
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                      תיאור המשרה
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {job.description}
                    </p>
                  </section>

                  <section>
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                      דרישות התפקיד
                    </h3>
                    <ul className="mt-3 flex flex-col gap-2">
                      {job.requirements.map((req, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  {jobCats.length > 0 && (
                    <section>
                      <h3 className="font-heading text-sm font-semibold text-foreground">
                        תחומים
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {jobCats.map((c) => (
                          <Badge key={c.id} variant="outline">
                            {c.name}
                          </Badge>
                        ))}
                      </div>
                    </section>
                  )}

                  <p className="text-xs text-muted-foreground">
                    פורסם ב{formatHebrewDate(job.postedAt)}
                  </p>
                </div>
              </ScrollArea>

              {/* Application channels */}
              <div className="border-t border-border bg-card p-6">
                {job.allowSiteApply || job.allowWhatsApp ? (
                  <>
                    <h3 className="mb-3 font-heading text-sm font-semibold text-foreground">
                      ערוצי הגשת מועמדות
                    </h3>
                    <div className="flex flex-col gap-2">
                      {job.allowSiteApply && (
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={() => setApplyOpen(true)}
                        >
                          <Send data-icon="inline-start" />
                          הגש מועמדות באתר
                        </Button>
                      )}
                      {job.allowWhatsApp && (
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={handleWhatsApp}
                          className="w-full border-whatsapp/30 bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90 hover:text-whatsapp-foreground"
                        >
                          <MessageCircle data-icon="inline-start" />
                          הגשה מהירה בוואטסאפ
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                    <FileText className="size-4" />
                    הגשת מועמדות לתפקיד זה אינה זמינה כרגע.
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {job && (
        <ApplyFormDialog
          job={job}
          open={applyOpen}
          onOpenChange={setApplyOpen}
          onSubmitApplication={onSubmitApplication}
        />
      )}
    </>
  )
}
