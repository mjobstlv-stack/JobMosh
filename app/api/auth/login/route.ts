export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { createSessionToken, createStaffToken, safeEqual } from "@/lib/session"
import { findStaffByEmail, verifyStaffPassword } from "@/lib/admin-staff"

// 5 login attempts per IP per minute — same policy as user login
const rlMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rlMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rlMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "יותר מדי ניסיונות — נסה שוב בעוד דקה" }, { status: 429 })
  }

  let body: { username?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const username = String(body.username ?? "").trim().slice(0, 64)
  const password = String(body.password ?? "").trim().slice(0, 128)

  const correctUser = process.env.ADMIN_USERNAME ?? ""
  const correctPass = process.env.ADMIN_PASSWORD ?? ""

  // Both checks always run (constant-time) to prevent user enumeration and timing attacks
  const userOk = safeEqual(username, correctUser)
  const passOk = safeEqual(password, correctPass)

  if (userOk && passOk) {
    const token = createSessionToken()
    const res = NextResponse.json({ ok: true, role: "superadmin" })
    res.cookies.set("jm_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    })
    return res
  }

  // Superadmin check failed — try staff login (email-based)
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 200))

  try {
    const staff = await findStaffByEmail(username)
    if (staff && verifyStaffPassword(password, staff.passwordHash)) {
      const token = createStaffToken(staff.id)
      const res = NextResponse.json({ ok: true, role: "staff", permissions: staff.permissions })
      res.cookies.set("jm_staff_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 12 * 60 * 60,
        path: "/",
      })
      return res
    }
  } catch {
    // Blob lookup failure — fall through to generic error
  }

  await new Promise((r) => setTimeout(r, 800 + Math.random() * 400))
  return NextResponse.json({ error: "שם משתמש או סיסמה שגויים" }, { status: 401 })
}
