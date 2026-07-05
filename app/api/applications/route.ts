import { NextResponse } from "next/server"
import { list, get } from "@vercel/blob"
import { cookies } from "next/headers"
import { verifySessionToken } from "@/lib/session"

export const runtime = "nodejs"

export async function GET() {
  // Only authenticated admins may read applications
  const cookieStore = await cookies()
  const token = cookieStore.get("jm_session")?.value
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { blobs } = await list({ prefix: "applications/" })
    const applications = await Promise.all(
      blobs.map(async (blob) => {
        const result = await get(blob.pathname, { access: "private" })
        if (!result) return null
        const text = await new Response(result.stream).text()
        return JSON.parse(text)
      }),
    )
    const validApplications = applications.filter(Boolean)
    // newest first
    validApplications.sort((a, b) => (b.id > a.id ? 1 : -1))
    return NextResponse.json(validApplications)
  } catch (err) {
    console.error("[applications] blob read failed:", err)
    return NextResponse.json([])
  }
}
