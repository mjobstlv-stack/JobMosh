"use client"

import { useEffect, useState } from "react"
import { Drawer } from "vaul"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { JobTags } from "@/components/job-board/job-tags"
import { ApplyFormContent } from "@/components/job-board/apply-form-content"
import { getCategoryIcon } from "@/lib/category-icons"
import { cn } from "@/lib/utils"
import {
  formatHebrewDate,
  type Application,
  type Category,
  type Job,
} from "@/lib/job-board-data"
import type { PublicUser } from "@/lib/user-types"
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  MapPin,
  MessageCircle,
  Send,
} from "lucide-react"

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return isMobile
}

export function JobDrawer({
  job,
  categories,
  onOpenChange,
  onApply,
  onSuccess,
  currentUser,
}: {
  job: Job | null
  categories: Category[]
  onOpenChange: (open: boolean) => void
  onApply: (job: Job) => void      // desktop only — opens external Dialog
  onSuccess: (app: Application) => void  // mobile in-drawer form submission
  currentUser?: PublicUser | null
}) {
  const isMobile = useIsMobile()
  const [applyView, setApplyView] = useState(false)

  // Reset apply view whenever the active job changes
  useEffect(() => {
    setApplyView(false)
  }, [job?.id])

  function handleWhatsApp() {
    if (!job) return
    const template = `היי, אני מעוניין/ת להגיש מועמדות למשרת ${job.title} באזור ${job.region} שפורסמה באתר שלך. אשמח לקבל פרטים נוספים.`
    const url = `https://wa.me/${job.whatsappNumber}?text=${encodeURIComponent(template)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const jobCats = job
    ? categories.filter((c) => job.categoryIds.includes(c.id))
    : []

  const jobContent = job ? (
    <>
      <div className="flex items-start gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          {(() => {
            const Icon = getCategoryIcon(jobCats[0]?.icon ?? "briefcase")
            return <Icon className="size-7" />
          })()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xl font-bold leading-tight text-foreground">{job.title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {job.company} · {job.city}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <JobTags job={job} />
      </div>
    </>
  ) : null

  const jobBody = job ? (
    <div className="flex flex-col gap-6 p-5">
      <section>
        <h3 className="font-heading text-sm font-semibold text-foreground">תיאור המשרה</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{job.description}</p>
      </section>

      <section>
        <h3 className="font-heading text-sm font-semibold text-foreground">דרישות התפקיד</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {job.requirements.map((req, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{req}</span>
            </li>
          ))}
        </ul>
      </section>

      {jobCats.length > 0 && (
        <section>
          <h3 className="font-heading text-sm font-semibold text-foreground">תחומים</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {jobCats.map((c) => (
              <Badge key={c.id} variant="outline">{c.name}</Badge>
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-muted-foreground">פורסם ב{formatHebrewDate(job.postedAt)}</p>
    </div>
  ) : null

  // Apply bar — button behaviour differs: mobile opens inline form, desktop opens dialog
  const applyBar = job ? (
    <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur-sm p-4">
      {job.allowSiteApply || job.allowWhatsApp ? (
        <div className="flex flex-col gap-2">
          {job.allowSiteApply && (
            <Button
              className="h-12 w-full"
              size="lg"
              onClick={() => isMobile ? setApplyView(true) : onApply(job)}
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
              className="h-12 w-full border-whatsapp/30 bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90 hover:text-whatsapp-foreground"
            >
              <MessageCircle data-icon="inline-start" />
              הגשה מהירה בוואטסאפ
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          <FileText className="size-4" />
          הגשת מועמדות לתפקיד זה אינה זמינה כרגע.
        </div>
      )}
    </div>
  ) : null

  return (
    <>
      {isMobile ? (
        /* ── Mobile: vaul Drawer — apply form rendered INSIDE the drawer ── */
        <Drawer.Root open={!!job} onOpenChange={onOpenChange}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50" />
            <Drawer.Content
              className={cn(
                "fixed bottom-0 left-0 right-0 z-50 flex max-h-[92dvh] flex-col",
                "rounded-t-3xl bg-card outline-none",
              )}
              dir="rtl"
            >
              {/* Drag handle */}
              <div className="mx-auto mt-3 mb-1 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />

              <Drawer.Title className="sr-only">{job?.title ?? "משרה"}</Drawer.Title>
              <Drawer.Description className="sr-only">{job?.company}</Drawer.Description>

              {applyView && job ? (
                /* ── Apply form view (inside the Drawer — no Dialog conflict) ── */
                <>
                  <div className="border-b border-border p-5 shrink-0 flex items-center gap-3">
                    <button
                      onClick={() => setApplyView(false)}
                      className="flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors"
                      aria-label="חזרה"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">הגשת מועמדות</p>
                      <p className="truncate text-xs text-muted-foreground">{job.title} · {job.company}</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto overscroll-contain p-5">
                    <ApplyFormContent
                      key={job.id}
                      job={job}
                      currentUser={currentUser}
                      onSuccess={(app) => {
                        onSuccess(app)
                        onOpenChange(false)
                      }}
                      onCancel={() => setApplyView(false)}
                    />
                  </div>
                </>
              ) : (
                /* ── Job details view ── */
                <>
                  <div className="border-b border-border p-5 shrink-0">
                    {jobContent}
                  </div>
                  <div className="flex-1 overflow-y-auto overscroll-contain">
                    {jobBody}
                  </div>
                  {applyBar}
                </>
              )}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        /* ── Desktop: Sheet — apply opens an external Dialog ── */
        <Sheet open={!!job} onOpenChange={onOpenChange}>
          <SheetContent side="right" className="gap-0 p-0 flex flex-col sm:max-w-lg">
            {job && (
              <>
                <SheetHeader className="border-b border-border p-5 shrink-0">
                  <SheetTitle className="sr-only">{job.title}</SheetTitle>
                  {jobContent}
                </SheetHeader>
                <ScrollArea className="flex-1 min-h-0">
                  {jobBody}
                </ScrollArea>
                {applyBar}
              </>
            )}
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
