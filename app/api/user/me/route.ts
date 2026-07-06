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
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await getUser(userId)
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
    // Backward compat for users created before name/phone/applications were added
    if (!user.name) user.name = (user.profiles[0] as { name?: string } | undefined)?.name ?? ""
    if (!user.phone) user.phone = (user.profiles[0] as { phone?: string } | undefined)?.phone ?? ""
    if (!user.applications) user.applications = []
    const { passwordHash: _, ...publicUser } = user
    return NextResponse.json(publicUser)
  } catch (err) {
    console.error("[me GET]", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await getUser(userId)
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Ensure required fields exist (backward compat)
    if (!user.name) user.name = (user.profiles[0] as { name?: string } | undefined)?.name ?? ""
    if (!user.phone) user.phone = (user.profiles[0] as { phone?: string } | undefined)?.phone ?? ""
    if (!user.applications) user.applications = []

    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }
    if (!body || typeof body !== "object")
      return NextResponse.json({ error: "invalid body" }, { status: 400 })

    const { profiles, name, phone } = body as {
      profiles?: unknown
      name?: unknown
      phone?: unknown
    }

    if (name !== undefined) {
      if (typeof name !== "string") return NextResponse.json({ error: "bad name" }, { status: 400 })
      user.name = name.slice(0, 100)
    }
    if (phone !== undefined) {
      if (typeof phone !== "string") return NextResponse.json({ error: "bad phone" }, { status: 400 })
      user.phone = phone.slice(0, 20)
    }

    if (profiles !== undefined) {
      if (!Array.isArray(profiles))
        return NextResponse.json({ error: "profiles must be array" }, { status: 400 })
      const valid = profiles.filter((p) => p !== null && typeof p === "object")
      user.profiles = (valid as UserProfile[]).map((p) => ({
        id: p.id || `profile-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: String(p.title ?? "").slice(0, 100),
        ...(p.cvPath && typeof p.cvPath === "string" && p.cvPath.startsWith(`cv/users/${userId}/`)
          ? { cvPath: p.cvPath }
          : {}),
        ...(p.cvFileName && typeof p.cvFileName === "string"
          ? { cvFileName: p.cvFileName.slice(0, 200) }
          : {}),
      }))
    }

    await saveUser(user)
    const { passwordHash: _, ...publicUser } = user
    return NextResponse.json(publicUser)
  } catch (err) {
    console.error("[me PUT]", err)
    return NextResponse.json({
      error: "Internal error",
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }
}
