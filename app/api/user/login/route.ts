import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { getUserByEmail } from "@/lib/blob-user"
import { createUserSessionToken } from "@/lib/session"

export const runtime = "nodejs"

const rlMap = new Map<string, { count: number; resetAt: number }>()
function checkRL(ip: string): boolean {
  const now = Date.now()
  const e = rlMap.get(ip)
  if (!e || now > e.resetAt) { rlMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true }
  if (e.count >= 5) return false
  e.count++; return true
}

const GENERIC = "מייל או סיסמה שגויים"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRL(ip)) return NextResponse.json({ error: "יותר מדי בקשות" }, { status: 429 })

  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: GENERIC }, { status: 401 })

  const user = await getUserByEmail(email)
  if (!user) {
    await bcrypt.hash(password, 10) // constant-time dummy to prevent timing attacks
    return NextResponse.json({ error: GENERIC }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return NextResponse.json({ error: GENERIC }, { status: 401 })

  const token = createUserSessionToken(user.id)
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
