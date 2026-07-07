"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import type { PublicUser } from "@/lib/user-types"

export function AccountForm({
  user,
  onUpdate,
}: {
  user: PublicUser
  onUpdate: (u: PublicUser) => void
}) {
  const [name, setName] = useState(user.name ?? "")
  const [phone, setPhone] = useState(user.phone ?? "")
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const errs: { name?: string; phone?: string } = {}
    if (!name.trim()) errs.name = "שדה חובה"
    if (phone.trim() && !/^0\d{1,2}-?\d{7}$/.test(phone.replace(/\s/g, "")))
      errs.phone = "מספר טלפון לא תקין (לדוגמה 050-1234567)"
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    setSaving(true)
    const res = await fetch("/api/user/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
    })
    setSaving(false)
    if (!res.ok) { toast.error("שגיאה בשמירה"); return }
    onUpdate(await res.json())
    toast.success("הפרטים עודכנו בהצלחה")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>הפרטים שלי</CardTitle>
        <CardDescription>השם והטלפון שיופיעו אוטומטית בהגשת מועמדות</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="af-name">שם מלא</FieldLabel>
            <Input
              id="af-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ישראל ישראלי"
            />
            {errors.name && <FieldError>{errors.name}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.phone}>
            <FieldLabel htmlFor="af-phone">טלפון</FieldLabel>
            <Input
              id="af-phone"
              type="tel"
              dir="ltr"
              className="text-right"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-1234567"
            />
            {errors.phone && <FieldError>{errors.phone}</FieldError>}
          </Field>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "שומר..." : "שמור שינויים"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
