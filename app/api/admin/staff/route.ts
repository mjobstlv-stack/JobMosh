export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySessionToken } from "@/lib/session"
import {
  listAllStaff,
  getStaff,
  saveStaff,
  deleteStaff,
  hashStaffPassword,
  ADMIN_PERMISSIONS,
  type AdminPermission,
} from "@/lib/admin-staff"

async function isSuperAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get("jm_session")?.value
  return !!token && verifySessionToken(token)
}

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const all = await listAllStaff()
  const safe = all.map(({ passwordHash: _, ...s }) => s)
  return NextResponse.json(safe)
}

export async function POST(req: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { name?: string; email?: string; password?: string; permissions?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const name = String(body.name ?? "").trim()
  const email = String(body.email ?? "").trim().toLowerCase()
  const password = String(body.password ?? "")
  const permissions = (body.permissions ?? [])
    .filter((p): p is AdminPermission => (ADMIN_PERMISSIONS as readonly string[]).includes(p))

  if (!name || !email || !password) {
    return NextResponse.json({ error: "שם, אימייל וסיסמה הם שדות חובה" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "הסיסמה חייבת להכיל לפחות 8 תווים" }, { status: 400 })
  }

  const id = `s${Date.now().toString(36)}`
  await saveStaff({
    id,
    name,
    email,
    passwordHash: hashStaffPassword(password),
    permissions,
    active: true,
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true, id }, { status: 201 })
}

export async function PUT(req: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { id?: string; name?: string; email?: string; password?: string; permissions?: string[]; active?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const id = String(body.id ?? "").trim()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const existing = await getStaff(id)
  if (!existing) return NextResponse.json({ error: "לא נמצא" }, { status: 404 })

  const updated = { ...existing }
  if (body.name !== undefined) updated.name = String(body.name).trim()
  if (body.email !== undefined) updated.email = String(body.email).trim().toLowerCase()
  if (body.active !== undefined) updated.active = Boolean(body.active)
  if (body.permissions !== undefined) {
    updated.permissions = (body.permissions)
      .filter((p): p is AdminPermission => (ADMIN_PERMISSIONS as readonly string[]).includes(p))
  }
  if (body.password) {
    const pw = String(body.password)
    if (pw.length < 8) return NextResponse.json({ error: "הסיסמה חייבת להכיל לפחות 8 תווים" }, { status: 400 })
    updated.passwordHash = hashStaffPassword(pw)
  }

  await saveStaff(updated)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id") ?? ""
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  await deleteStaff(id)
  return NextResponse.json({ ok: true })
}
