import { type NextRequest, NextResponse } from "next/server"

// Protects all /api/admin/* routes — quick cookie existence check.
// Full HMAC verification + per-permission authorization happens inside
// each API route handler (requires Node.js runtime, not available in
// Edge middleware). Staff cookies pass here; the route decides access.
export function proxy(request: NextRequest) {
  const superSession = request.cookies.get("jm_session")
  const staffSession = request.cookies.get("jm_staff_session")
  if (!superSession?.value && !staffSession?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.next()
}

export const config = {
  matcher: "/api/admin/:path*",
}
