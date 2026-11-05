import { NextResponse } from "next/server"
import { list, put, del } from "@vercel/blob"
import { requireAdminPermission } from "@/lib/admin-auth"
import { getSettings, SETTINGS_BLOB_PATH } from "@/lib/get-settings"
import { normalizeSettings } from "@/lib/job-board-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(await getSettings())
}

export async function POST(req: Request) {
  // Settings and Nav tabs both write this object — either permission suffices.
  const auth = (await requireAdminPermission("settings")).ok
    ? { ok: true }
    : await requireAdminPermission("nav")
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Expected object" }, { status: 400 })
  }

  const settings = normalizeSettings(body)
  try {
    const { blobs } = await list({ prefix: SETTINGS_BLOB_PATH })
    await Promise.all(blobs.map((b) => del(b.url)))
    await put(SETTINGS_BLOB_PATH, JSON.stringify(settings), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
    })
    return NextResponse.json({ ok: true, settings })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
