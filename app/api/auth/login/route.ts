export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { createSessionToken, createStaffToken, safeEqual } from "@/lib/session"
import { findStaffByEmail, verifyStaffPassword } from "@/lib/admin-staff"

export async function POST(req: Request) {
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
