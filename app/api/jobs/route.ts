import { NextResponse } from "next/server"
import { list, put, del } from "@vercel/blob"
import { cookies } from "next/headers"
import { verifySessionToken } from "@/lib/session"
import { INITIAL_JOBS } from "@/lib/job-board-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BLOB_PATH = "config/jobs.json"

export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(INITIAL_JOBS)
  }
  try {
    const { blobs } = await list({ prefix: BLOB_PATH })
    if (blobs.length === 0) return NextResponse.json(INITIAL_JOBS)
    const res = await fetch(blobs[0].url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
      cache: "no-store",
    })
    if (!res.ok) return NextResponse.json(INITIAL_JOBS)
    const data = await res.json()
    return NextResponse.json(Array.isArray(data) ? data : INITIAL_JOBS)
  } catch {
    return NextResponse.json(INITIAL_JOBS)
  }
}

export async function POST(req: Request) {
  const jar = await cookies()
  const token = jar.get("jm_session")?.value
  if (!token || !verifySessionToken(token)) {
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
    console.error("[jobs] blob write failed:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
