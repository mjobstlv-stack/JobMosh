import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { put, del } from "@vercel/blob"
import { verifyUserSessionToken } from "@/lib/session"
import { getUser, saveUser } from "@/lib/blob-user"
import { sanitizeFilename, validateCvFile } from "@/lib/cv-file"

export const runtime = "nodejs"


async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("jm_user_session")?.value
  if (!token) return null
  return verifyUserSessionToken(token)
}

export async function POST(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const form = await req.formData()
  const profileIdRaw = form.get("profileId")
  // profileId becomes part of the blob path — allow only safe id characters
  const profileId =
    typeof profileIdRaw === "string" && /^[\w-]{1,80}$/.test(profileIdRaw) ? profileIdRaw : null
  const fileEntry = form.get("cv")
  const file = fileEntry instanceof File ? fileEntry : null
  if (!profileId || !file) return NextResponse.json({ error: "profileId and cv required" }, { status: 400 })
  const check = await validateCvFile(file)
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 })

  // Delete old CV if provided and valid — works for both new and existing profiles
  const oldCvPathRaw = form.get("oldCvPath")
  const oldCvPath = typeof oldCvPathRaw === "string" ? oldCvPathRaw : null
  if (oldCvPath && oldCvPath.startsWith(`cv/users/${userId}/`)) {
    try { await del(oldCvPath) } catch { /* ignore */ }
  }

  let blob
  try {
    blob = await put(
      `cv/users/${userId}/${profileId}-${sanitizeFilename(file.name)}`,
      check.bytes,
      { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: check.contentType },
    )
  } catch (err) {
    console.error("[cv POST] put error:", err)
    return NextResponse.json({ error: "שגיאה בהעלאת הקובץ לאחסון" }, { status: 500 })
  }

  return NextResponse.json({ cvPath: blob.pathname, cvFileName: file.name })
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(userId)
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const { profileId } = body as { profileId?: string }
  const profile = user.profiles.find(p => p.id === profileId)
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  if (profile.cvPath) {
    try { await del(profile.cvPath) } catch { /* ignore */ }
    delete profile.cvPath
    delete profile.cvFileName
    await saveUser(user)
  }

  const { passwordHash: _, ...publicUser } = user
  return NextResponse.json(publicUser)
}
