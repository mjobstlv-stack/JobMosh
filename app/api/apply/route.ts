import { SITE_URL } from "@/lib/site"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { get, put } from "@vercel/blob"
import { cookies } from "next/headers"
import { verifyUserSessionToken } from "@/lib/session"
import { getUser, saveUser } from "@/lib/blob-user"
import { getLiveJobs } from "@/lib/get-jobs"
import { sanitizeFilename, validateCvFile } from "@/lib/cv-file"

export const runtime = "nodejs"


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

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "יותר מדי בקשות — נסה שוב בעוד דקה" },
      { status: 429 },
    )
  }

  try {
    const form = await req.formData()

    const str = (key: string, max: number) => {
      const v = form.get(key)
      return typeof v === "string" ? v.trim().slice(0, max) : ""
    }
    const name = str("name", 100)
    const phone = str("phone", 30)
    const message = str("message", 2000)
    const jobId = str("jobId", 200)
    const cvEntry = form.get("cv")
    const cvFile = cvEntry instanceof File && cvEntry.size > 0 ? cvEntry : null

    if (!name || !phone || !jobId) {
      return NextResponse.json({ error: "חסרים שדות חובה" }, { status: 400 })
    }

    // Job details and the recipient come from the server-side job record, never
    // from the form — otherwise anyone could use this endpoint to send mail
    // from our domain to arbitrary addresses.
    const job = (await getLiveJobs()).find((j) => j.id === jobId && j.status === "active")
    if (!job || !job.allowSiteApply) {
      return NextResponse.json({ error: "המשרה לא נמצאה או שאינה פתוחה להגשה" }, { status: 404 })
    }
    const jobTitle = job.title
    const jobCompany = job.company

    let cvBytes: Buffer | null = null
    let cvContentType = ""
    if (cvFile) {
      const check = await validateCvFile(cvFile)
      if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 })
      cvBytes = check.bytes
      cvContentType = check.contentType
    }

    const recipient = job.notificationEmail?.trim() || process.env.NOTIFICATION_EMAIL

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
        <p style="color: #999; font-size: 12px;">נשלח דרך <a href="${SITE_URL}">jobmosh.co.il</a></p>
      </div>
    `

    const attachments: { filename: string; content: Buffer }[] = []
    let cvUrl: string | undefined
    let profileCvFileName: string | undefined

    if (cvFile && cvBytes) {
      attachments.push({
        filename: sanitizeFilename(cvFile.name),
        content: cvBytes,
      })

      try {
        const safeName = sanitizeFilename(cvFile.name)
        const blob = await put(`cv/${Date.now()}-${safeName}`, cvBytes, {
          access: "private",
          contentType: cvContentType,
        })
        cvUrl = blob.downloadUrl
      } catch (blobErr) {
        console.error("[apply] blob upload failed (continuing):", blobErr)
      }
    }

    // If no CV file uploaded, check if user wants to use their saved profile CV
    if (!cvFile) {
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
                    content: buffer,
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

    const resend = new Resend(process.env.RESEND_API_KEY)
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
