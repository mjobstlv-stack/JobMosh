"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"

function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError("הסיסמה חייבת להכיל לפחות 8 תווים"); return }
    if (password !== confirm) { setError("הסיסמאות אינן תואמות"); return }
    setLoading(true); setError("")
    const res = await fetch("/api/user/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "שגיאה"); return }
    setDone(true)
  }

  if (done) return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
      <p className="text-foreground font-medium">הסיסמה עודכנה בהצלחה!</p>
      <Button className="w-full" onClick={() => router.push("/")}>חזרה לדף הבית</Button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8 space-y-4">
      <h1 className="text-xl font-bold text-foreground">איפוס סיסמה</h1>
      <Field>
        <FieldLabel htmlFor="rp-pw">סיסמה חדשה</FieldLabel>
        <Input id="rp-pw" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="לפחות 8 תווים" />
      </Field>
      <Field>
        <FieldLabel htmlFor="rp-confirm">אימות סיסמה</FieldLabel>
        <Input id="rp-confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
      </Field>
      {error && <FieldError>{error}</FieldError>}
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "מעדכן..." : "עדכן סיסמה"}</Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="block text-center font-heading text-2xl font-extrabold text-foreground">
          ג&apos;וב<span className="text-primary">מוש</span>
        </Link>
        <Suspense fallback={<div className="text-center text-muted-foreground">טוען...</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
