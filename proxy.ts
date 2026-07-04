import { type NextRequest, NextResponse } from "next/server"

// Protects all /api/admin/* routes — quick cookie existence check.
// Full HMAC token verification happens inside each API route handler
// (requires Node.js runtime, not available in Edge middleware).
export function proxy(request: NextRequest) {
  const session = request.cookies.get("jm_session")
  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.next()
}

export const config = {
  matcher: "/api/admin/:path*",
}
