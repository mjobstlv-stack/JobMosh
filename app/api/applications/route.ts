import { NextResponse } from "next/server"
import { list } from "@vercel/blob"
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

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json([])
  }
  try {
    const { blobs } = await list({ prefix: "applications/" })
    const applications = await Promise.all(
      blobs.map((blob) => fetch(blob.url).then((r) => r.json())),
    )
    // newest first
    applications.sort((a, b) => (b.id > a.id ? 1 : -1))
    return NextResponse.json(applications)
  } catch (err) {
    console.error("[applications] blob read failed:", err)
    return NextResponse.json([])
  }
}
