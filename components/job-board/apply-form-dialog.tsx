"use client"

import { useState } from "react"
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
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldContent,
} from "@/components/ui/field"
import { cn } from "@/lib/utils"
import { UploadCloud, FileCheck2 } from "lucide-react"
import type { Application, Job } from "@/lib/job-board-data"

type Errors = {
  name?: string
  phone?: string
  consent?: string
}

export function ApplyFormDialog({
  job,
  open,
  onOpenChange,
  onSubmitApplication,
}: {
  job: Job
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitApplication: (app: Application) => void
}) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  function reset() {
    setName("")
    setPhone("")
    setMessage("")
    setCvFile(null)
    setConsent(false)
    setErrors({})
  }

  function validate(): boolean {
    const next: Errors = {}
    if (name.trim().length < 2) next.name = "נא להזין שם מלא"
    if (!/^0\d{1,2}-?\d{7}$/.test(phone.replace(/\s/g, "")))
      next.phone = "נא להזין מספר טלפון תקין (לדוגמה 050-1234567)"
    if (!consent) next.consent = "יש לאשר את מדיניות הפרטיות כדי להמשיך"
    setErrors(next)
    if (Object.keys(next).length !== 0) return false
    if (cvFile && cvFile.size > 5 * 1024 * 1024) {
      toast.error("הקובץ גדול מדי — מקסימום 5MB")
      return false
    }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    // Read CV as data URL before sending so admin can view it later
    let cvDataUrl: string | undefined
    let cvFileName: string | undefined
    if (cvFile) {
      cvFileName = cvFile.name
      try {
        cvDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(cvFile)
        })
      } catch {
        // CV data URL failed — file still sent via email
      }
    }

    const formData = new FormData()
    formData.append("name", name.trim())
    formData.append("phone", phone.trim())
    formData.append("message", message.trim())
    formData.append("jobId", job.id)
    formData.append("jobTitle", job.title)
    formData.append("jobCompany", job.company)
    if (job.notificationEmail) formData.append("notificationEmail", job.notificationEmail)
    if (cvFile) formData.append("cv", cvFile)

    try {
      const res = await fetch("/api/apply", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "שגיאה בשליחת המועמדות, נסה שנית")
        return
      }

      onSubmitApplication({
        id: `app-${Date.now()}`,
        jobId: job.id,
        jobTitle: job.title,
        name: name.trim(),
        phone: phone.trim(),
        message: message.trim(),
        date: new Date().toISOString().slice(0, 10),
        cvFileName,
        cvDataUrl,
      })

      toast.success("המועמדות נשלחה בהצלחה!", {
        description: `הפנייה שלך למשרת "${job.title}" התקבלה. נחזור אליך בהקדם.`,
      })
      reset()
      onOpenChange(false)
    } catch {
      toast.error("שגיאה בשליחת המועמדות, נסה שנית")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>הגשת מועמדות</DialogTitle>
          <DialogDescription>
            למשרת {job.title} · {job.company}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="apply-name">שם מלא</FieldLabel>
              <Input
                id="apply-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ישראל ישראלי"
                aria-invalid={!!errors.name}
              />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor="apply-phone">טלפון</FieldLabel>
              <Input
                id="apply-phone"
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="050-1234567"
                aria-invalid={!!errors.phone}
                className="text-right"
              />
              {errors.phone && <FieldError>{errors.phone}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="apply-message">הודעה קצרה</FieldLabel>
              <Textarea
                id="apply-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="ספרו בקצרה למה אתם מתאימים לתפקיד..."
                rows={3}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="apply-cv">קובץ קורות חיים</FieldLabel>
              <label
                htmlFor="apply-cv"
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input bg-muted/40 px-4 py-3 text-sm transition-colors hover:border-primary/50 hover:bg-accent/40",
                  cvFile && "border-primary/40 bg-accent/30",
                )}
              >
                {cvFile ? (
                  <FileCheck2 className="size-5 text-primary" />
                ) : (
                  <UploadCloud className="size-5 text-muted-foreground" />
                )}
                <span className="truncate text-foreground">
                  {cvFile ? cvFile.name : "בחרו קובץ PDF או Word להעלאה"}
                </span>
                <input
                  id="apply-cv"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="sr-only"
                  onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </Field>

            <Field data-invalid={!!errors.consent} orientation="horizontal">
              <Checkbox
                id="apply-consent"
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
                aria-invalid={!!errors.consent}
              />
              <FieldContent>
                <FieldLabel htmlFor="apply-consent" className="font-normal">
                  אני מאשר/ת את מדיניות הפרטיות ושמירת הפרטים
                </FieldLabel>
                {errors.consent && <FieldError>{errors.consent}</FieldError>}
              </FieldContent>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6 flex-col-reverse gap-2 sm:flex-row sm:justify-start">
            <Button type="submit">שליחת מועמדות</Button>
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
