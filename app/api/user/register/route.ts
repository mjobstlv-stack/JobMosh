import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { getUserByEmail, saveUser, createEmailLookup } from "@/lib/blob-user"
import { createUserSessionToken } from "@/lib/session"

export const runtime = "nodejs"

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/
const rlMap = new Map<string, { count: number; resetAt: number }>()

function checkRL(ip: string): boolean {
  const now = Date.now()
  const e = rlMap.get(ip)
  if (!e || now > e.resetAt) { rlMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true }
  if (e.count >= 5) return false
  e.count++; return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRL(ip)) return NextResponse.json({ error: "יותר מדי בקשות" }, { status: 429 })

  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: "מייל וסיסמה נדרשים" }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "כתובת מייל לא תקינה" }, { status: 400 })
  if (typeof password !== "string" || password.length < 8)
    return NextResponse.json({ error: "הסיסמה חייבת להכיל לפחות 8 תווים" }, { status: 400 })

  const existing = await getUserByEmail(email)
  if (existing) return NextResponse.json({ error: "כתובת המייל כבר רשומה" }, { status: 409 })

  const userId = `user-${Date.now()}`
  const passwordHash = await bcrypt.hash(password, 10)
  const user = {
    id: userId,
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt: new Date().toISOString().slice(0, 10),
    profiles: [],
    applications: [],
  }
  await saveUser(user)
  await createEmailLookup(email, userId)

  const token = createUserSessionToken(userId)
  const cookieStore = await cookies()
  cookieStore.set("jm_user_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  })
  return NextResponse.json({ ok: true })
}
