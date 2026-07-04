import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export const runtime = "nodejs"

const resend = new Resend(process.env.RESEND_API_KEY)
const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5MB

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()

    const name = (form.get("name") as string | null)?.trim() ?? ""
    const phone = (form.get("phone") as string | null)?.trim() ?? ""
    const message = (form.get("message") as string | null)?.trim() ?? ""
    const jobId = (form.get("jobId") as string | null) ?? ""
    const jobTitle = (form.get("jobTitle") as string | null) ?? ""
    const jobCompany = (form.get("jobCompany") as string | null) ?? ""
    const notificationEmail =
      (form.get("notificationEmail") as string | null)?.trim() || null
    const cvFile = form.get("cv") as File | null

    if (!name || !phone || !jobId) {
      return NextResponse.json({ error: "חסרים שדות חובה" }, { status: 400 })
    }

    if (cvFile && cvFile.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "הקובץ גדול מדי — מקסימום 5MB" },
        { status: 400 },
      )
    }

    const recipient = notificationEmail ?? process.env.NOTIFICATION_EMAIL

    if (!recipient) {
      return NextResponse.json(
        { error: "לא הוגדר מייל יעד" },
        { status: 500 },
      )
    }

    const from = process.env.RESEND_FROM ?? "onboarding@resend.dev"
    const subject = `פנייה חדשה — ${jobTitle} | ${name}`

    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #163300;">ג'וב מוש — פנייה חדשה</h2>
        <table style="width:100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #666;">משרה</td><td style="padding: 6px 0;"><strong>${escHtml(jobTitle)}</strong> · ${escHtml(jobCompany)}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">מועמד</td><td style="padding: 6px 0;">${escHtml(name)}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">טלפון</td><td style="padding: 6px 0;" dir="ltr">${escHtml(phone)}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">הודעה</td><td style="padding: 6px 0;">${message ? escHtml(message) : "—"}</td></tr>
        </table>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">נשלח דרך <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobmosh.co.il"}">jobmosh.co.il</a></p>
      </div>
    `

    const attachments: { filename: string; content: string }[] = []

    if (cvFile && cvFile.size > 0) {
      const buffer = await cvFile.arrayBuffer()
      const base64 = Buffer.from(buffer).toString("base64")
      attachments.push({ filename: cvFile.name, content: base64 })
    }

    const { error: sendError } = await resend.emails.send({
      from,
      to: [recipient],
      subject,
      html,
      attachments,
    })

    if (sendError) {
      console.error("[apply] resend error:", sendError)
      return NextResponse.json({ error: "שגיאה בשליחת המייל" }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[apply] email send error:", err)
    return NextResponse.json({ error: "שגיאה בשליחת המייל" }, { status: 500 })
  }
}
