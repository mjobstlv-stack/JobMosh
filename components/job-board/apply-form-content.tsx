"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { toast } from "sonner"
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
import { ProfileSelector } from "@/components/user/profile-selector"
import type { PublicUser, UserProfile } from "@/lib/user-types"

type Errors = { name?: string; phone?: string; consent?: string }

export function ApplyFormContent({
  job,
  currentUser,
  onSuccess,
  onCancel,
}: {
  job: Job
  currentUser?: PublicUser | null
  onSuccess: (app: Application) => void
  onCancel?: () => void
}) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const prefilled = useRef(false)

  // Pre-fill name/phone from user account (once)
  useEffect(() => {
    if (!prefilled.current && currentUser) {
      prefilled.current = true
      setName(currentUser.name ?? "")
      setPhone(currentUser.phone ?? "")
      if (currentUser.profiles.length) {
        const first = currentUser.profiles[0]
        setSelectedProfileId(first.id)
        setSelectedProfile(first)
      }
    }
  }, [currentUser])

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
    setSaving(true)

    const cvFileName = cvFile?.name
    const formData = new FormData()
    formData.append("name", name.trim())
    formData.append("phone", phone.trim())
    formData.append("message", message.trim())
    formData.append("jobId", job.id)
    formData.append("jobTitle", job.title)
    formData.append("jobCompany", job.company)
    if (job.notificationEmail) formData.append("notificationEmail", job.notificationEmail)
    if (cvFile) formData.append("cv", cvFile)
    if (selectedProfileId) formData.append("profileId", selectedProfileId)
    if (selectedProfile?.cvPath && !cvFile) formData.append("useProfileCv", "true")

    try {
      const res = await fetch("/api/apply", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "שגיאה בשליחת המועמדות, נסה שנית")
        setSaving(false)
        return
      }
      onSuccess({
        id: `app-${Date.now()}`,
        jobId: job.id,
        jobTitle: job.title,
        name: name.trim(),
        phone: phone.trim(),
        message: message.trim(),
        date: new Date().toISOString().slice(0, 10),
        cvFileName,
        cvDataUrl: data.cvUrl,
      })
      toast.success("המועמדות נשלחה בהצלחה!", {
        description: `הפנייה שלך למשרת "${job.title}" התקבלה. נחזור אליך בהקדם.`,
      })
    } catch {
      toast.error("שגיאה בשליחת המועמדות, נסה שנית")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <FieldGroup>
        {currentUser && currentUser.profiles.length > 0 && (
          <ProfileSelector
            profiles={currentUser.profiles}
            selectedId={selectedProfileId}
            onSelect={(p) => { setSelectedProfile(p); setSelectedProfileId(p.id) }}
          />
        )}
        {currentUser && currentUser.profiles.length === 0 && (
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <Link href="/profile" className="text-primary underline">שמור פרופיל</Link> כדי לצרף קורות חיים שמורים
          </div>
        )}

        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="afc-name">שם מלא</FieldLabel>
          <Input
            id="afc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ישראל ישראלי"
            aria-invalid={!!errors.name}
          />
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.phone}>
          <FieldLabel htmlFor="afc-phone">טלפון</FieldLabel>
          <Input
            id="afc-phone"
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
          <FieldLabel htmlFor="afc-message">הודעה קצרה</FieldLabel>
          <Textarea
            id="afc-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="ספרו בקצרה למה אתם מתאימים לתפקיד..."
            rows={3}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="afc-cv">קובץ קורות חיים</FieldLabel>
          <label
            htmlFor="afc-cv"
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
              {cvFile ? cvFile.name : "בחרו קובץ PDF או Word"}
            </span>
            <input
              id="afc-cv"
              type="file"
              accept=".pdf,.doc,.docx"
              className="sr-only"
              onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </Field>

        <Field data-invalid={!!errors.consent} orientation="horizontal">
          <Checkbox
            id="afc-consent"
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
            aria-invalid={!!errors.consent}
          />
          <FieldContent>
            <FieldLabel htmlFor="afc-consent" className="font-normal">
              אני מאשר/ת את{" "}
              <a href="/terms" target="_blank" className="underline hover:text-primary">
                תנאי השירות
              </a>{" "}
              ו
              <a href="/privacy" target="_blank" className="underline hover:text-primary">
                מדיניות הפרטיות
              </a>
            </FieldLabel>
            {errors.consent && <FieldError>{errors.consent}</FieldError>}
          </FieldContent>
        </Field>
      </FieldGroup>

      <div className="mt-4 flex flex-col gap-2">
        <Button type="submit" disabled={saving} className="h-12 w-full" size="lg">
          {saving ? "שולח..." : "שליחת מועמדות"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="w-full">
            ביטול
          </Button>
        )}
      </div>
    </form>
  )
}
