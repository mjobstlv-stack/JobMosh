"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { UploadCloud, FileCheck2 } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import type { UserProfile } from "@/lib/user-types"

export function ProfileForm({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: UserProfile | null
  onSave: (profile: UserProfile) => void
}) {
  const [title, setTitle] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (initial) { setTitle(initial.title); setName(initial.name); setPhone(initial.phone) }
    else { setTitle(""); setName(""); setPhone("") }
    setCvFile(null); setErrors({})
  }, [open, initial])

  async function handleSave() {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = "שדה חובה"
    if (!name.trim()) errs.name = "שדה חובה"
    if (!phone.trim()) errs.phone = "שדה חובה"
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    const profileId = initial?.id ?? `profile-${Date.now()}`
    let cvPath = initial?.cvPath
    let cvFileName = initial?.cvFileName

    if (cvFile) {
      const form = new FormData()
      form.append("profileId", profileId)
      form.append("cv", cvFile)
      if (initial?.cvPath) form.append("oldCvPath", initial.cvPath)
      const res = await fetch("/api/user/cv", { method: "POST", body: form })
      if (!res.ok) { toast.error("שגיאה בהעלאת קורות חיים"); setSaving(false); return }
      const data: { cvPath: string; cvFileName: string } = await res.json()
      cvPath = data.cvPath
      cvFileName = data.cvFileName
    }

    onSave({ id: profileId, title: title.trim(), name: name.trim(), phone: phone.trim(), cvPath, cvFileName })
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>{initial ? "עריכת פרופיל" : "פרופיל חדש"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field data-invalid={!!errors.title}>
            <FieldLabel htmlFor="pf-title">שם התפקיד</FieldLabel>
            <Input id="pf-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="מפתח Full Stack" />
            {errors.title && <FieldError>{errors.title}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="pf-name">שם מלא</FieldLabel>
            <Input id="pf-name" value={name} onChange={e => setName(e.target.value)} placeholder="ישראל ישראלי" />
            {errors.name && <FieldError>{errors.name}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.phone}>
            <FieldLabel htmlFor="pf-phone">טלפון</FieldLabel>
            <Input id="pf-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="050-1234567" />
            {errors.phone && <FieldError>{errors.phone}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>קורות חיים (PDF/Word)</FieldLabel>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-4 hover:border-primary/50 transition-colors">
              {cvFile ? (
                <><FileCheck2 className="size-6 text-primary" /><span className="text-sm">{cvFile.name}</span></>
              ) : initial?.cvFileName ? (
                <><FileCheck2 className="size-6 text-primary" /><span className="text-sm">{initial.cvFileName}</span><span className="text-xs text-muted-foreground">לחץ להחלפה</span></>
              ) : (
                <><UploadCloud className="size-6 text-muted-foreground" /><span className="text-sm text-muted-foreground">לחץ להעלאת קורות חיים</span></>
              )}
              <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={e => setCvFile(e.target.files?.[0] ?? null)} />
            </label>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "שומר..." : "שמור"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
