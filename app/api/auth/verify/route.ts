export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySessionToken, verifyStaffToken } from "@/lib/session"
import { getStaff } from "@/lib/admin-staff"

export async function GET() {
  const cookieStore = await cookies()

  const superToken = cookieStore.get("jm_session")?.value
  if (superToken && verifySessionToken(superToken)) {
    return NextResponse.json({ authenticated: true, role: "superadmin" })
  }

  const staffToken = cookieStore.get("jm_staff_session")?.value
  if (staffToken) {
    const staffId = verifyStaffToken(staffToken)
    if (staffId) {
      try {
        const staff = await getStaff(staffId)
        if (staff && staff.active) {
          return NextResponse.json({
            authenticated: true,
            role: "staff",
            permissions: staff.permissions,
          })
        }
      } catch {
        // Blob read failure — treat as unauthenticated
      }
    }
  }

  return NextResponse.json({ authenticated: false }, { status: 401 })
}
