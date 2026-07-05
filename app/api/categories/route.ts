import { NextResponse } from "next/server"
import { list, put, del, get } from "@vercel/blob"
import { cookies } from "next/headers"
import { verifySessionToken } from "@/lib/session"
import { INITIAL_CATEGORIES } from "@/lib/job-board-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BLOB_PATH = "config/categories.json"

export async function GET() {
  try {
    const result = await get(BLOB_PATH, { access: "private" })
    if (!result) return NextResponse.json(INITIAL_CATEGORIES)
    const text = await new Response(result.stream).text()
    const data = JSON.parse(text)
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

  try {
    const { blobs } = await list({ prefix: BLOB_PATH })
    await Promise.all(blobs.map((b) => del(b.url)))
    await put(BLOB_PATH, JSON.stringify(categories), {
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
