import { NextRequest, NextResponse } from "next/server"
import { requireAdminPermission } from "@/lib/admin-auth"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  // CV files are part of the applications workflow
  const auth = await requireAdminPermission("applications")
  if (!auth.ok) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const url = req.nextUrl.searchParams.get("url")
  if (!url) return new NextResponse("Missing url param", { status: 400 })

  // Validate it's a Vercel Blob URL to prevent SSRF
  const parsed = new URL(url)
  if (!parsed.hostname.endsWith("vercel-storage.com")) {
    return new NextResponse("Invalid URL", { status: 400 })
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (!blobToken) {
    return new NextResponse("Blob token not configured", { status: 500 })
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${blobToken}` },
  })

  if (!res.ok) {
    return new NextResponse("Failed to fetch file", { status: res.status })
  }

  const contentType = res.headers.get("content-type") ?? "application/octet-stream"
  const body = await res.arrayBuffer()

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=3600",
    },
  })
}
