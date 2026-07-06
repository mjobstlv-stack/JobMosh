import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyUserSessionToken } from "@/lib/session"
import { getUser, saveUser } from "@/lib/blob-user"
import type { UserProfile } from "@/lib/user-types"

export const runtime = "nodejs"

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("jm_user_session")?.value
  if (!token) return null
  return verifyUserSessionToken(token)
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(userId)
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const { passwordHash: _, ...publicUser } = user
  return NextResponse.json(publicUser)
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(userId)
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  if (!body || typeof body !== "object" || !Array.isArray((body as Record<string, unknown>).profiles))
    return NextResponse.json({ error: "profiles must be array" }, { status: 400 })
  const { profiles } = body as { profiles: unknown[] }

  const validProfiles = profiles.filter(p => p !== null && typeof p === "object")
  user.profiles = (validProfiles as UserProfile[]).map(p => ({
    id: p.id || `profile-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: String(p.title ?? "").slice(0, 100),
    name: String(p.name ?? "").slice(0, 100),
    phone: String(p.phone ?? "").slice(0, 20),
    ...(p.cvPath && typeof p.cvPath === "string" && p.cvPath.startsWith(`cv/users/${userId}/`)
      ? { cvPath: p.cvPath }
      : {}),
    ...(p.cvFileName && typeof p.cvFileName === "string"
      ? { cvFileName: p.cvFileName.slice(0, 200) }
      : {}),
  }))

  await saveUser(user)
  const { passwordHash: _, ...publicUser } = user
  return NextResponse.json(publicUser)
}
