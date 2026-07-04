"use client"

import { useEffect, useState } from "react"
import { Briefcase, ChevronRight, Eye, EyeOff, Lock, User } from "lucide-react"

const STORAGE_KEY = "jm_auth_v1"

export function LoginGate({
  children,
  onBack,
}: {
  children: React.ReactNode
  onBack?: () => void
}) {
  const [auth, setAuth] = useState<"loading" | "ok" | "no">("loading")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [shake, setShake] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Verify session cookie with the server on mount
  useEffect(() => {
    fetch("/api/auth/verify")
      .then((r) => setAuth(r.ok ? "ok" : "no"))
      .catch(() => setAuth("no"))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        setAuth("ok")
      } else {
        const data = await res.json().catch(() => ({}))
        triggerError(data.error ?? "שגיאה בכניסה. נסה שוב.")
      }
    } catch {
      triggerError("שגיאת חיבור. נסה שוב.")
    } finally {
      setSubmitting(false)
    }
  }

  function triggerError(msg: string) {
    setError(msg)
    setShake(true)
    setPassword("")
    setTimeout(() => {
      setShake(false)
      setError("")
    }, 1800)
  }

  if (auth === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0d1f00]">
        <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </div>
    )
  }

  if (auth === "ok") return <>{children}</>

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a1800] via-[#163300] to-[#1c3d00] p-4">
      {/* Background blobs */}
      <div className="pointer-events-none absolute -top-32 -start-32 size-[500px] rounded-full bg-white/[0.03] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -end-24 size-[400px] rounded-full bg-amber-500/[0.07] blur-3xl" />

      {/* Sparkle dots */}
      <div className="absolute top-20 end-1/4 size-2 rounded-full bg-amber-400/60" />
      <div className="absolute top-36 end-1/3 size-1.5 rounded-full bg-white/30" />
      <div className="absolute bottom-32 start-1/4 size-2.5 rounded-full bg-amber-300/40 blur-sm" />
      <div className="absolute top-28 start-1/3 size-1 rounded-full bg-white/25" />
      <div className="absolute bottom-20 end-1/3 size-1.5 rounded-full bg-amber-400/35" />
      <div className="absolute top-1/2 start-16 size-1 rounded-full bg-white/20" />

      {/* Login card */}
      <div
        className="relative w-full max-w-sm"
        style={shake ? { animation: "shake 0.4s ease-in-out" } : undefined}
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
            <Briefcase className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            ג'וב<span className="text-amber-400">מוש</span>
          </h1>
          <p className="mt-1.5 text-sm text-white/45">כניסת מנהל</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-6 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Username */}
            <div className="relative">
              <User className="absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
              <input
                type="text"
                placeholder="שם משתמש"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                disabled={submitting}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 pe-11 text-right text-sm text-white placeholder-white/35 outline-none transition-all focus:border-amber-400/50 focus:bg-white/15 disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
              <input
                type={showPw ? "text" : "password"}
                placeholder="סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={submitting}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 pe-11 ps-11 text-right text-sm text-white placeholder-white/35 outline-none transition-all focus:border-amber-400/50 focus:bg-white/15 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                tabIndex={-1}
                className="absolute start-3.5 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-white/60"
                aria-label={showPw ? "הסתר סיסמה" : "הצג סיסמה"}
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            <div className="h-4">
              {error && (
                <p className="text-center text-xs text-red-400/90">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!username || !password || submitting}
              className="relative h-12 w-full rounded-xl bg-amber-500 font-semibold text-white transition-all hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  מאמת...
                </span>
              ) : (
                "כניסה"
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-white/25">
          גישה מוגבלת לצוות מורשה בלבד
        </p>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-4 flex w-full items-center justify-center gap-1.5 text-sm text-white/35 transition-colors hover:text-white/65"
          >
            <ChevronRight className="size-4" />
            חזרה לאתר
          </button>
        )}
      </div>
    </div>
  )
}
