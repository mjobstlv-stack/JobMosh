import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { randomBytes } from "node:crypto"
import { getUserByEmail, saveResetToken } from "@/lib/blob-user"

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

  const { email } = await req.json()
  if (!email) return NextResponse.json({ ok: true })

  const user = await getUserByEmail(email)
  if (!user) return NextResponse.json({ ok: true }) // no enumeration

  const token = randomBytes(32).toString("hex")
  await saveResetToken(token, user.id)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobmosh.co.il"
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
    to: [email],
    subject: "איפוס סיסמה — ג'וב מוש",
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;">
        <h2 style="color:#163300;">איפוס סיסמה</h2>
        <p>קיבלנו בקשה לאיפוס הסיסמה שלך. הקישור תקף לשעה אחת.</p>
        <a href="${siteUrl}/reset-password?token=${token}"
           style="display:inline-block;background:#163300;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">
          אפס סיסמה
        </a>
        <p style="color:#999;font-size:12px;">אם לא ביקשת איפוס, התעלם ממייל זה.</p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
