import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { put, del } from "@vercel/blob"
import { verifyUserSessionToken } from "@/lib/session"
import { getUser, saveUser } from "@/lib/blob-user"

export const runtime = "nodejs"

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("jm_user_session")?.value
  if (!token) return null
  return verifyUserSessionToken(token)
}

function safeName(name: string): string {
  return name.replace(/\.\./g, "_").replace(/[^\wא-ת.\-]/g, "_").slice(0, 100)
}

export async function POST(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(userId)
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const form = await req.formData()
  const profileIdRaw = form.get("profileId")
  const profileId = typeof profileIdRaw === "string" ? profileIdRaw : null
  const file = form.get("cv") as File | null
  if (!profileId || !file) return NextResponse.json({ error: "profileId and cv required" }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "הקובץ גדול מדי — מקסימום 5MB" }, { status: 400 })
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "PDF או Word בלבד" }, { status: 400 })

  const profile = user.profiles.find(p => p.id === profileId)
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  if (profile.cvPath) {
    try { await del(profile.cvPath) } catch { /* ignore */ }
  }

  const blob = await put(
    `cv/users/${userId}/${profileId}-${safeName(file.name)}`,
    file,
    { access: "private" },
  )
  profile.cvPath = blob.pathname
  profile.cvFileName = file.name
  await saveUser(user)

  const { passwordHash: _, ...publicUser } = user
  return NextResponse.json(publicUser)
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
