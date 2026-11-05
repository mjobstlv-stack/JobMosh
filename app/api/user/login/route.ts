import { NextRequest, NextResponse } from "next/server"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { getUserByEmail } from "@/lib/blob-user"
import { createUserSessionToken } from "@/lib/session"

export const runtime = "nodejs"


const GENERIC = "מייל או סיסמה שגויים"

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  if (!(await rateLimit("user-login", ip, 5, 60))) return NextResponse.json({ error: "יותר מדי בקשות" }, { status: 429 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: GENERIC }, { status: 401 }) }
  const { email, password } = body as { email?: string; password?: string }
  if (!email || !password) return NextResponse.json({ error: GENERIC }, { status: 401 })

  const user = await getUserByEmail(email.toLowerCase().trim())
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
