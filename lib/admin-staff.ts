import { get, put, del, list } from "@vercel/blob"
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

export const ADMIN_PERMISSIONS = [
  "jobs",
  "categories",
  "applications",
  "settings",
  "nav",
  "users",
] as const

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number]

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  jobs: "משרות",
  categories: "קטגוריות",
  applications: "פניות",
  settings: "הגדרות",
  nav: "תפריט",
  users: "משתמשים",
}

export type AdminStaff = {
  id: string
  name: string
  email: string
  passwordHash: string
  permissions: AdminPermission[]
  active: boolean
  createdAt: string
}

export type PublicAdminStaff = Omit<AdminStaff, "passwordHash">

const PREFIX = "admin-staff/"

export function hashStaffPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const key = scryptSync(password, salt, 32)
  return `${salt}:${key.toString("hex")}`
}

export function verifyStaffPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  try {
    const derived = scryptSync(password, salt, 32)
    return timingSafeEqual(Buffer.from(hash, "hex"), derived)
  } catch {
    return false
  }
}

export async function getStaff(id: string): Promise<AdminStaff | null> {
  try {
    const r = await get(`${PREFIX}${id}.json`, { access: "private" })
    if (!r) return null
    return JSON.parse(await new Response(r.stream).text()) as AdminStaff
  } catch {
    return null
  }
}

export async function saveStaff(staff: AdminStaff): Promise<void> {
  await put(`${PREFIX}${staff.id}.json`, JSON.stringify(staff), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  })
}

export async function deleteStaff(id: string): Promise<void> {
  await del(`${PREFIX}${id}.json`)
}

export async function listAllStaff(): Promise<AdminStaff[]> {
  const blobs: { pathname: string }[] = []
  let cursor: string | undefined
  do {
    const result = await list({ prefix: PREFIX, cursor, limit: 1000 })
    blobs.push(...result.blobs)
    cursor = result.cursor
  } while (cursor)

  const results = await Promise.all(
    blobs
      .filter((b) => /^admin-staff\/[^/]+\.json$/.test(b.pathname))
      .map((b) => {
        const id = b.pathname.slice(PREFIX.length, -".json".length)
        return getStaff(id)
      }),
  )
  return results.filter(Boolean) as AdminStaff[]
}

export async function findStaffByEmail(email: string): Promise<AdminStaff | null> {
  const all = await listAllStaff()
  return (
    all.find(
      (s) => s.email.toLowerCase() === email.toLowerCase() && s.active,
    ) ?? null
  )
}
