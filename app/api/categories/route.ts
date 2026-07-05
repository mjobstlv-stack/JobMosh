import { NextResponse } from "next/server"
import { list, put, del } from "@vercel/blob"
import { cookies } from "next/headers"
import { verifySessionToken } from "@/lib/session"
import { INITIAL_CATEGORIES } from "@/lib/job-board-data"

export const runtime = "nodejs"

const BLOB_PATH = "config/categories.json"

export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(INITIAL_CATEGORIES)
  }
  try {
    const { blobs } = await list({ prefix: BLOB_PATH })
    if (blobs.length === 0) return NextResponse.json(INITIAL_CATEGORIES)
    const res = await fetch(blobs[0].url, { cache: "no-store" })
    if (!res.ok) return NextResponse.json(INITIAL_CATEGORIES)
    const data = await res.json()
    return NextResponse.json(Array.isArray(data) ? data : INITIAL_CATEGORIES)
  } catch {
    return NextResponse.json(INITIAL_CATEGORIES)
  }
}

export async function POST(req: Request) {
  const jar = await cookies()
  const token = jar.get("jm_session")?.value
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let categories: unknown
  try {
    categories = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  if (!Array.isArray(categories)) {
    return NextResponse.json({ error: "Expected array" }, { status: 400 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Blob not configured" }, { status: 503 })
  }

  const { blobs } = await list({ prefix: BLOB_PATH })
  await Promise.all(blobs.map((b) => del(b.url)))

  await put(BLOB_PATH, JSON.stringify(categories), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  })

  return NextResponse.json({ ok: true })
}
