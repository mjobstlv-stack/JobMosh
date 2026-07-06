import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getResetToken, deleteResetToken, getUser, saveUser } from "@/lib/blob-user"

export const runtime = "nodejs"

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
  if (!checkRL(ip)) return NextResponse.json({ ok: true }) // silently rate-limit

  let body: { token?: unknown; newPassword?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 })
  }
  const { token, newPassword } = body

  if (!token || typeof token !== "string" || typeof newPassword !== "string" || newPassword.length < 8)
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 })

  const tokenData = await getResetToken(token)
  if (!tokenData || Date.now() > tokenData.expiresAt)
    return NextResponse.json({ error: "הקישור פג תוקף — בקש קישור חדש" }, { status: 400 })

  const user = await getUser(tokenData.userId)
  if (!user) return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 })

  await deleteResetToken(token)
  user.passwordHash = await bcrypt.hash(newPassword, 10)
  await saveUser(user)

  return NextResponse.json({ ok: true })
}
