import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { get, put } from "@vercel/blob"
import { cookies } from "next/headers"
import { verifyUserSessionToken } from "@/lib/session"
import { getUser, saveUser } from "@/lib/blob-user"

export const runtime = "nodejs"

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/

// Simple in-memory rate limit: 5 submissions per IP per minute
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

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function sanitizeFilename(name: string): string {
  // Allow Hebrew letters, ASCII word chars, dots, hyphens; block path traversal
  return name
    .replace(/\.\./g, "_")
    .replace(/[^\wא-ת.\-]/g, "_")
    .slice(0, 100)
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "יותר מדי בקשות — נסה שוב בעוד דקה" },
      { status: 429 },
    )
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
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

    // Validate notification email format to prevent relay abuse
    if (notificationEmail && !EMAIL_RE.test(notificationEmail)) {
      return NextResponse.json({ error: "מייל לא תקין" }, { status: 400 })
    }

    if (cvFile && cvFile.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "הקובץ גדול מדי — מקסימום 5MB" },
        { status: 400 },
      )
    }

    // Validate MIME type
    if (cvFile && cvFile.size > 0 && !ALLOWED_MIME.has(cvFile.type)) {
      return NextResponse.json(
        { error: "סוג קובץ לא נתמך — יש להעלות PDF או Word בלבד" },
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
    let cvUrl: string | undefined
    let profileCvFileName: string | undefined

    if (cvFile && cvFile.size > 0) {
      const buffer = await cvFile.arrayBuffer()
      const base64 = Buffer.from(buffer).toString("base64")
      attachments.push({
        filename: sanitizeFilename(cvFile.name),
        content: base64,
      })

      try {
        const safeName = sanitizeFilename(cvFile.name)
        const blob = await put(`cv/${Date.now()}-${safeName}`, cvFile, {
          access: "private",
        })
        cvUrl = blob.downloadUrl
      } catch (blobErr) {
        console.error("[apply] blob upload failed (continuing):", blobErr)
      }
    }

    // If no CV file uploaded, check if user wants to use their saved profile CV
    if (!cvFile || cvFile.size === 0) {
      const useProfileCv = form.get("useProfileCv") === "true"
      const submittedProfileId = (() => {
        const v = form.get("profileId")
        return typeof v === "string" ? v : ""
      })()

      if (useProfileCv && submittedProfileId) {
        try {
          const cookieStore = await cookies()
          const userToken = cookieStore.get("jm_user_session")?.value
          if (userToken) {
            const userId = verifyUserSessionToken(userToken)
            if (userId) {
              const user = await getUser(userId)
              const profile = user?.profiles.find(p => p.id === submittedProfileId)
              if (profile?.cvPath) {
                const blobResult = await get(profile.cvPath, { access: "private" })
                if (blobResult?.statusCode === 200 && blobResult.stream) {
                  const chunks: Uint8Array[] = []
                  const reader = blobResult.stream.getReader()
                  while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    chunks.push(value)
                  }
                  const buffer = Buffer.concat(chunks.map(c => Buffer.from(c)))
                  const cvName = profile.cvFileName ?? "cv.pdf"
                  profileCvFileName = cvName
                  attachments.push({
                    filename: sanitizeFilename(cvName),
                    content: buffer.toString("base64"),
                  })
                }
              }
            }
          }
        } catch (err) {
          console.error("[apply] profile CV fetch failed:", err)
          // Don't fail the application — continue without CV
        }
      }
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

    // Store application in Blob so admin can see all submissions from any browser
    try {
      const appId = `app-${Date.now()}`
      await put(
        `applications/${appId}.json`,
        JSON.stringify({
          id: appId,
          jobId,
          jobTitle,
          name,
          phone,
          message,
          date: new Date().toISOString().slice(0, 10),
          cvFileName: cvFile?.name ? sanitizeFilename(cvFile.name) : (profileCvFileName ? sanitizeFilename(profileCvFileName) : undefined),
          cvDataUrl: cvUrl,
        }),
        {
          access: "private",
          addRandomSuffix: false,
          contentType: "application/json",
        },
      )
    } catch (blobErr) {
      console.error("[apply] blob application save failed:", blobErr)
    }

    // Record in user's application history if logged in
    try {
      const cookieStore = await cookies()
      const userToken = cookieStore.get("jm_user_session")?.value
      if (userToken) {
        const userId = verifyUserSessionToken(userToken)
        if (userId) {
          const user = await getUser(userId)
          if (user) {
            const profileIdVal = form.get("profileId")
            const profileId = typeof profileIdVal === "string" ? profileIdVal : ""
            if (!user.applications) user.applications = []
            user.applications.push({
              jobId,
              jobTitle,
              company: jobCompany,
              appliedAt: new Date().toISOString().slice(0, 10),
              profileId,
            })
            await saveUser(user)
          }
        }
      }
    } catch (err) {
      console.error("[apply] user history update failed:", err)
    }

    return NextResponse.json({ ok: true, cvUrl })
  } catch (err) {
    console.error("[apply] email send error:", err)
    return NextResponse.json({ error: "שגיאה בשליחת המייל" }, { status: 500 })
  }
}
