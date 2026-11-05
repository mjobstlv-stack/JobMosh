import { NextResponse } from "next/server"
import { list, put, del } from "@vercel/blob"
import { requireAdminPermission } from "@/lib/admin-auth"
import { getSettings, SETTINGS_BLOB_PATH } from "@/lib/get-settings"
import { normalizeSettings, type GlobalSettings } from "@/lib/job-board-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(await getSettings())
}

export async function POST(req: Request) {
  // Settings and Nav tabs both write this object; each field is gated by its
  // own permission: nav* fields need "nav", everything else needs "settings".
  const canSettings = (await requireAdminPermission("settings")).ok
  const canNav = (await requireAdminPermission("nav")).ok
  if (!canSettings && !canNav) {
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

  const incoming = normalizeSettings(body)
  const current = await getSettings()
  const settings: GlobalSettings = { ...current }
  for (const key of Object.keys(incoming) as (keyof GlobalSettings)[]) {
    const allowed = key.startsWith("nav") ? canNav : canSettings
    if (allowed) (settings as Record<string, unknown>)[key] = incoming[key]
  }
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
