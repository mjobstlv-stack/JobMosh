export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { createSessionToken, safeEqual } from "@/lib/session"

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

  if (!userOk || !passOk) {
    // Fixed-time delay makes brute-force significantly slower
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 400))
    return NextResponse.json(
      { error: "שם משתמש או סיסמה שגויים" },
      { status: 401 },
    )
  }

  const token = createSessionToken()
  const res = NextResponse.json({ ok: true })

  res.cookies.set("jm_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24h
    path: "/",
  })

  return res
}
