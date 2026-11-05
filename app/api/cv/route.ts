import { NextRequest, NextResponse } from "next/server"
import { requireAdminPermission } from "@/lib/admin-auth"
import { CV_CONTENT_TYPES } from "@/lib/cv-file"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  // CV files are part of the applications workflow
  const auth = await requireAdminPermission("applications")
  if (!auth.ok) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const url = req.nextUrl.searchParams.get("url")
  if (!url) return new NextResponse("Missing url param", { status: 400 })

  // Only our own private Blob store, over HTTPS — the request carries our
  // Blob token, so it must never be sent to any other host (SSRF / token leak).
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new NextResponse("Invalid URL", { status: 400 })
  }
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".blob.vercel-storage.com")) {
    return new NextResponse("Invalid URL", { status: 400 })
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (!blobToken) {
    return new NextResponse("Blob token not configured", { status: 500 })
  }

  const res = await fetch(parsed, {
    headers: { Authorization: `Bearer ${blobToken}` },
    redirect: "error",
  })

  if (!res.ok) {
    return new NextResponse("Failed to fetch file", { status: res.status })
  }

  // Never trust the stored content type: only PDF may render inline (a PDF
  // can't run page scripts); anything else is a forced download with a sandbox
  // CSP, so e.g. an HTML file disguised as a CV can never execute here.
  const stored = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase()
  const isPdf = stored === "application/pdf"
  const body = await res.arrayBuffer()

  return new NextResponse(body, {
    headers: {
      "Content-Type": CV_CONTENT_TYPES.has(stored) ? stored : "application/octet-stream",
      "Content-Disposition": isPdf ? "inline" : "attachment",
      ...(isPdf ? {} : { "Content-Security-Policy": "sandbox; default-src 'none'" }),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  })
}
