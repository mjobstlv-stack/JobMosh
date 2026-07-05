"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldSet,
  FieldLegend,
  FieldDescription,
} from "@/components/ui/field"
import {
  REGIONS,
  JOB_TYPES,
  WORK_MODELS,
  CITY_REGION_MAP,
  type Category,
  type Job,
  type JobStatus,
  type Region,
  type JobType,
  type WorkModel,
} from "@/lib/job-board-data"
import { Send, MessageCircle, Mail } from "lucide-react"

type Draft = Omit<Job, "id" | "postedAt"> & { id?: string; postedAt?: string }

const EMPTY: Draft = {
  title: "",
  company: "",
  region: "מרכז",
  jobType: "משרה מלאה",
  workModel: "מהמשרד",
  city: "",
  description: "",
  requirements: [],
  categoryIds: [],
  status: "active",
  allowSiteApply: true,
  allowWhatsApp: true,
  whatsappNumber: "972541234567",
  notificationEmail: "",
}

export function JobFormDialog({
  open,
  onOpenChange,
  editingJob,
  categories,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingJob: Job | null
  categories: Category[]
  onSave: (job: Job) => void
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [requirementsText, setRequirementsText] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      if (editingJob) {
        setDraft({ ...editingJob })
        setRequirementsText(editingJob.requirements.join("\n"))
      } else {
        setDraft(EMPTY)
        setRequirementsText("")
      }
      setErrors({})
    }
  }, [open, editingJob])

  useEffect(() => {
    const trimmed = draft.city?.trim() ?? ""
    if (!trimmed) return
    const region = CITY_REGION_MAP[trimmed]
    if (region) setDraft((prev) => ({ ...prev, region }))
  }, [draft.city])

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function toggleCategory(id: string) {
    setDraft((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (draft.title.trim().length < 2) next.title = "נא להזין כותרת משרה"
    if (draft.company.trim().length < 2) next.company = "נא להזין שם חברה"
    if (draft.city.trim().length < 2) next.city = "נא להזין עיר"
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const requirements = requirementsText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean)

    const saved: Job = {
      id: draft.id ?? `job-${Date.now()}`,
      postedAt: draft.postedAt ?? new Date().toISOString().slice(0, 10),
      title: draft.title.trim(),
      company: draft.company.trim(),
      region: draft.region,
      jobType: draft.jobType,
      workModel: draft.workModel,
      city: draft.city.trim(),
      description: draft.description.trim(),
      requirements,
      categoryIds: draft.categoryIds,
      status: draft.status,
      allowSiteApply: draft.allowSiteApply,
      allowWhatsApp: draft.allowWhatsApp,
      whatsappNumber: draft.whatsappNumber,
      notificationEmail: draft.notificationEmail?.trim() || undefined,
    }

    onSave(saved)
    toast.success(editingJob ? "המשרה עודכנה בהצלחה" : "המשרה נוספה בהצלחה")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingJob ? "עריכת משרה" : "הוספת משרה חדשה"}
          </DialogTitle>
          <DialogDescription>
            מלאו את פרטי המשרה. שדות חובה מסומנים.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.title}>
                <FieldLabel htmlFor="job-title">כותרת המשרה</FieldLabel>
                <Input
                  id="job-title"
                  value={draft.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="מפתח/ת Full Stack"
                  aria-invalid={!!errors.title}
                />
                {errors.title && <FieldError>{errors.title}</FieldError>}
              </Field>
              <Field data-invalid={!!errors.company}>
                <FieldLabel htmlFor="job-company">שם החברה</FieldLabel>
                <Input
                  id="job-company"
                  value={draft.company}
                  onChange={(e) => set("company", e.target.value)}
                  placeholder="נובה טכנולוגיות"
                  aria-invalid={!!errors.company}
                />
                {errors.company && <FieldError>{errors.company}</FieldError>}
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.city}>
                <FieldLabel htmlFor="job-city">עיר</FieldLabel>
                <Input
                  id="job-city"
                  value={draft.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="תל אביב"
                  aria-invalid={!!errors.city}
                />
                {errors.city && <FieldError>{errors.city}</FieldError>}
              </Field>
              <Field>
                <FieldLabel>סטטוס</FieldLabel>
                <Select
                  value={draft.status}
                  onValueChange={(v) => set("status", v as JobStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">פעילה</SelectItem>
                    <SelectItem value="draft">טיוטה</SelectItem>
                    <SelectItem value="archived">בארכיון</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel>אזור</FieldLabel>
                <Select
                  value={draft.region}
                  onValueChange={(v) => set("region", v as Region)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>היקף משרה</FieldLabel>
                <Select
                  value={draft.jobType}
                  onValueChange={(v) => set("jobType", v as JobType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>מודל עבודה</FieldLabel>
                <Select
                  value={draft.workModel}
                  onValueChange={(v) => set("workModel", v as WorkModel)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_MODELS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="job-desc">תיאור המשרה</FieldLabel>
              <Textarea
                id="job-desc"
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="תארו את התפקיד, האחריות והסביבה..."
                rows={3}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="job-req">
                דרישות התפקיד (שורה לכל דרישה)
              </FieldLabel>
              <Textarea
                id="job-req"
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                placeholder={"ניסיון של 3 שנים\nשליטה ב-React"}
                rows={3}
              />
            </Field>

            <FieldSet>
              <FieldLegend>קטגוריות</FieldLegend>
              <div className="flex flex-wrap gap-x-5 gap-y-3">
                {categories.map((cat) => (
                  <Field key={cat.id} orientation="horizontal" className="w-auto">
                    <Checkbox
                      id={`cat-${cat.id}`}
                      checked={draft.categoryIds.includes(cat.id)}
                      onCheckedChange={() => toggleCategory(cat.id)}
                    />
                    <FieldLabel
                      htmlFor={`cat-${cat.id}`}
                      className="font-normal"
                    >
                      {cat.name}
                    </FieldLabel>
                  </Field>
                ))}
              </div>
            </FieldSet>

            <FieldSet>
              <FieldLegend>ניהול ערוצי הגשה</FieldLegend>
              <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <Send className="size-4 text-primary" />
                    הגשת מועמדות בטופס באתר
                  </span>
                  <Switch
                    checked={draft.allowSiteApply}
                    onCheckedChange={(v) => set("allowSiteApply", v)}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <MessageCircle className="size-4 text-whatsapp" />
                    כפתור הגשה בוואטסאפ
                  </span>
                  <Switch
                    checked={draft.allowWhatsApp}
                    onCheckedChange={(v) => set("allowWhatsApp", v)}
                  />
                </label>
                {draft.allowWhatsApp && (
                  <Field>
                    <FieldLabel htmlFor="job-wa">
                      מספר וואטסאפ (כולל קידומת מדינה)
                    </FieldLabel>
                    <Input
                      id="job-wa"
                      dir="ltr"
                      value={draft.whatsappNumber}
                      onChange={(e) => set("whatsappNumber", e.target.value)}
                      placeholder="972541234567"
                      className="text-right"
                    />
                  </Field>
                )}
                {draft.allowSiteApply && (
                  <Field>
                    <FieldLabel htmlFor="job-email">
                      <Mail className="inline size-4 text-primary me-1" />
                      מייל לקבלת פניות מהאתר
                    </FieldLabel>
                    <Input
                      id="job-email"
                      type="email"
                      dir="ltr"
                      value={draft.notificationEmail ?? ""}
                      onChange={(e) => set("notificationEmail", e.target.value)}
                      placeholder="employer@company.com"
                      className="text-right"
                    />
                    <FieldDescription>
                      השאר ריק לשימוש במייל ברירת המחדל של המערכת
                    </FieldDescription>
                  </Field>
                )}
              </div>
            </FieldSet>
          </FieldGroup>

          <DialogFooter className="mt-6 flex-col-reverse gap-2 sm:flex-row sm:justify-start">
            <Button type="submit">
              {editingJob ? "שמירת שינויים" : "הוספת המשרה"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ביטול
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
