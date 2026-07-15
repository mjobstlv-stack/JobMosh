import { cookies } from "next/headers"
import { verifySessionToken, verifyStaffToken } from "@/lib/session"
import { getStaff, type AdminPermission } from "@/lib/admin-staff"

export type AdminAuthResult =
  | { ok: true; role: "superadmin" }
  | { ok: true; role: "staff"; staffId: string; permissions: AdminPermission[] }
  | { ok: false }

/**
 * Server-side admin authorization. Superadmin (jm_session) is allowed
 * everything; staff (jm_staff_session) must be active and hold the
 * required permission. Reads staff record fresh from Blob on every call,
 * so disabling a staff member or revoking a permission takes effect
 * immediately, not at token expiry.
 */
export async function requireAdminPermission(
  permission: AdminPermission,
): Promise<AdminAuthResult> {
  const jar = await cookies()

  const superToken = jar.get("jm_session")?.value
  if (superToken && verifySessionToken(superToken)) {
    return { ok: true, role: "superadmin" }
  }

  const staffToken = jar.get("jm_staff_session")?.value
  if (staffToken) {
    const staffId = verifyStaffToken(staffToken)
    if (staffId) {
      try {
        const staff = await getStaff(staffId)
        if (staff && staff.active && staff.permissions.includes(permission)) {
          return { ok: true, role: "staff", staffId, permissions: staff.permissions }
        }
      } catch {
        // Blob read failure — deny
      }
    }
  }

  return { ok: false }
}
