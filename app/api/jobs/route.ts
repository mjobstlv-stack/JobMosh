import { NextResponse } from "next/server"
import { list, put, del, get } from "@vercel/blob"
import { requireAdminPermission } from "@/lib/admin-auth"
import { INITIAL_JOBS } from "@/lib/job-board-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BLOB_PATH = "config/jobs.json"

export async function GET() {
  try {
    const result = await get(BLOB_PATH, { access: "private" })
    if (!result) return NextResponse.json(INITIAL_JOBS)
    const text = await new Response(result.stream).text()
    const data = JSON.parse(text)
    return NextResponse.json(Array.isArray(data) ? data : INITIAL_JOBS)
  } catch {
    return NextResponse.json(INITIAL_JOBS)
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminPermission("jobs")
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let jobs: unknown
  try {
    jobs = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  if (!Array.isArray(jobs)) {
    return NextResponse.json({ error: "Expected array" }, { status: 400 })
  }

  try {
    const { blobs } = await list({ prefix: BLOB_PATH })
    await Promise.all(blobs.map((b) => del(b.url)))
    await put(BLOB_PATH, JSON.stringify(jobs), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
