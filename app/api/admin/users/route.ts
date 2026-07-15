import { NextResponse } from "next/server"
import { list } from "@vercel/blob"
import { requireAdminPermission } from "@/lib/admin-auth"
import { getUser } from "@/lib/blob-user"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdminPermission("users")
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const allBlobs: { pathname: string }[] = []
    let cursor: string | undefined
    do {
      const result = await list({ prefix: "users/", cursor, limit: 1000 })
      allBlobs.push(...result.blobs)
      cursor = result.cursor
    } while (cursor)

    // Only direct user files: users/user-<id>.json
    const userBlobs = allBlobs.filter((b) =>
      /^users\/user-[^/]+\.json$/.test(b.pathname),
    )

    const users = await Promise.all(
      userBlobs.map(async (b) => {
        const userId = b.pathname.slice("users/".length, -".json".length)
        const user = await getUser(userId)
        if (!user) return null
        // Backward compat
        if (!user.name) user.name = (user.profiles[0] as { name?: string } | undefined)?.name ?? ""
        if (!user.phone) user.phone = (user.profiles[0] as { phone?: string } | undefined)?.phone ?? ""
        if (!user.applications) user.applications = []
        const { passwordHash: _, ...publicUser } = user
        return publicUser
      }),
    )

    return NextResponse.json(users.filter(Boolean))
  } catch (err) {
    console.error("[admin/users GET]", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
