import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getResetToken, deleteResetToken, getUser, saveUser } from "@/lib/blob-user"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json()

  if (!token || typeof newPassword !== "string" || newPassword.length < 8)
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 })

  const tokenData = await getResetToken(token)
  if (!tokenData || Date.now() > tokenData.expiresAt)
    return NextResponse.json({ error: "הקישור פג תוקף — בקש קישור חדש" }, { status: 400 })

  const user = await getUser(tokenData.userId)
  if (!user) return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 })

  user.passwordHash = await bcrypt.hash(newPassword, 10)
  await saveUser(user)
  await deleteResetToken(token)

  return NextResponse.json({ ok: true })
}
