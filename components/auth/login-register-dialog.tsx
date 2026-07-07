"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import type { PublicUser } from "@/lib/user-types"

type Tab = "login" | "register" | "forgot"

export function LoginRegisterDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (user: PublicUser) => void
}) {
  const [tab, setTab] = useState<Tab>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  function switchTab(t: Tab) {
    setTab(t); setEmail(""); setPassword(""); setConfirm(""); setName(""); setPhone(""); setError(""); setForgotSent(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("")
    const res = await fetch("/api/user/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) { setError((await res.json()).error ?? "שגיאה"); setLoading(false); return }
    const me = await fetch("/api/user/me")
    onSuccess(await me.json())
    onOpenChange(false); toast.success("ברוך הבא!"); setLoading(false)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError("שם מלא נדרש"); return }
    if (password !== confirm) { setError("הסיסמאות אינן תואמות"); return }
    setLoading(true); setError("")
    const res = await fetch("/api/user/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name.trim(), phone: phone.trim() }),
    })
    if (!res.ok) { setError((await res.json()).error ?? "שגיאה"); setLoading(false); return }
    const me = await fetch("/api/user/me")
    onSuccess(await me.json())
    onOpenChange(false); toast.success("החשבון נוצר בהצלחה!"); setLoading(false)
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("")
    const res = await fetch("/api/user/forgot-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      if (res.status === 404) {
        setError("כתובת המייל אינה רשומה במערכת")
      } else {
        setError((data as { detail?: string }).detail ?? "שגיאה בשליחת המייל, נסה שנית")
      }
      setLoading(false); return
    }
    setForgotSent(true); setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {tab === "login" ? "כניסה" : tab === "register" ? "הרשמה" : "שכחתי סיסמה"}
          </DialogTitle>
        </DialogHeader>

        {tab !== "forgot" && (
          <div className="flex overflow-hidden rounded-xl border border-border">
            {(["login", "register"] as Tab[]).map(t => (
              <button key={t} type="button" onClick={() => switchTab(t)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}>
                {t === "login" ? "כניסה" : "הרשמה"}
              </button>
            ))}
          </div>
        )}

        {tab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="lr-email">מייל</FieldLabel>
              <Input id="lr-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field>
              <FieldLabel htmlFor="lr-pw">סיסמה</FieldLabel>
              <Input id="lr-pw" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </Field>
            {error && <FieldError>{error}</FieldError>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "נכנס..." : "כניסה"}</Button>
            <button type="button" onClick={() => switchTab("forgot")}
              className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
              שכחתי סיסמה
            </button>
          </form>
        )}

        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="reg-name">שם מלא</FieldLabel>
              <Input id="reg-name" value={name} onChange={e => setName(e.target.value)} placeholder="ישראל ישראלי" />
            </Field>
            <Field>
              <FieldLabel htmlFor="reg-phone">
                טלפון <span className="text-muted-foreground text-xs">(אופציונלי)</span>
              </FieldLabel>
              <Input id="reg-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="050-1234567" />
            </Field>
            <Field>
              <FieldLabel htmlFor="reg-email">מייל</FieldLabel>
              <Input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field>
              <FieldLabel htmlFor="reg-pw">סיסמה</FieldLabel>
              <Input id="reg-pw" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="לפחות 8 תווים" />
            </Field>
            <Field>
              <FieldLabel htmlFor="reg-confirm">אימות סיסמה</FieldLabel>
              <Input id="reg-confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </Field>
            {error && <FieldError>{error}</FieldError>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "נרשם..." : "הרשמה"}</Button>
          </form>
        )}

        {tab === "forgot" && (
          forgotSent ? (
            <div className="space-y-4 py-2 text-center">
              <p className="text-foreground">שלחנו קישור לאיפוס הסיסמה לכתובת {email}</p>
              <Button variant="outline" onClick={() => switchTab("login")}>חזרה לכניסה</Button>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <Field>
                <FieldLabel htmlFor="fp-email">מייל</FieldLabel>
                <Input id="fp-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </Field>
              {error && <FieldError>{error}</FieldError>}
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "שולח..." : "שלח קישור איפוס"}</Button>
              <button type="button" onClick={() => switchTab("login")}
                className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
                חזרה לכניסה
              </button>
            </form>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
