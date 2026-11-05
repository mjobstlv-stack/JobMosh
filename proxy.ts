import { type NextRequest, NextResponse } from "next/server"

/**
 * Host-based split between the public site and the admin panel.
 *
 * - On ADMIN_HOST (e.g. manage.jobmosh.co.il) every page request is rewritten
 *   to the internal /panel route; /api/* passes through to the shared API.
 * - On any other host, /panel is a 404 — the admin is not reachable from www.
 * - /api/admin/* keeps the quick cookie-existence check. Full HMAC verification
 *   + per-permission authorization happens inside each API route handler.
 */
const ADMIN_HOST = (process.env.ADMIN_HOST || "").trim().toLowerCase()

function hostnameOf(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || ""
  return host.split(",")[0].trim().split(":")[0].toLowerCase()
}

function notFound(request: NextRequest) {
  // Rewrite to a path that matches no route → renders app/not-found.tsx with a 404.
  return NextResponse.rewrite(new URL("/__not-found", request.url))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/admin")) {
    const superSession = request.cookies.get("jm_session")
    const staffSession = request.cookies.get("jm_staff_session")
    if (!superSession?.value && !staffSession?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const isAdminHost = ADMIN_HOST !== "" && hostnameOf(request) === ADMIN_HOST

  if (!isAdminHost) {
    if (pathname === "/panel" || pathname.startsWith("/panel/")) return notFound(request)
    return NextResponse.next()
  }

  // ── Admin host ──────────────────────────────────────────────────────────
  if (pathname === "/robots.txt") {
    return new NextResponse("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain", "X-Robots-Tag": "noindex, nofollow" },
    })
  }

  const response = pathname.startsWith("/api/")
    ? NextResponse.next()
    : pathname === "/sitemap.xml"
      ? notFound(request)
      : NextResponse.rewrite(new URL("/panel", request.url))
  response.headers.set("X-Robots-Tag", "noindex, nofollow")
  return response
}

export const config = {
  // Everything except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|css|js|map)$).*)",
  ],
}
