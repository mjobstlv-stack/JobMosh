import { NextResponse } from "next/server"
import { list } from "@vercel/blob"
import { cookies } from "next/headers"
import { verifySessionToken } from "@/lib/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const jar = await cookies()
  const token = jar.get("jm_session")?.value
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result: Record<string, unknown> = {
    env_token_set: !!process.env.BLOB_READ_WRITE_TOKEN,
    env_token_prefix: process.env.BLOB_READ_WRITE_TOKEN?.slice(0, 8) ?? null,
  }

  // List all blobs under config/
  try {
    const { blobs } = await list({ prefix: "config/" })
    result.config_blobs = blobs.map((b) => ({
      pathname: b.pathname,
      url: b.url,
      downloadUrl: b.downloadUrl,
      size: b.size,
      uploadedAt: b.uploadedAt,
    }))
  } catch (err) {
    result.list_error = err instanceof Error ? err.message : String(err)
  }

  // Try fetching the jobs blob if found
  const configBlobs = result.config_blobs as Array<{ downloadUrl: string; pathname: string }> | undefined
  const jobsBlob = configBlobs?.find((b) => b.pathname.startsWith("config/jobs"))
  if (jobsBlob) {
    try {
      const res = await fetch(jobsBlob.downloadUrl, { cache: "no-store" })
      result.jobs_fetch_status = res.status
      result.jobs_fetch_ok = res.ok
      if (res.ok) {
        const text = await res.text()
        result.jobs_content_length = text.length
        result.jobs_content_preview = text.slice(0, 200)
      } else {
        result.jobs_fetch_body = await res.text()
      }
    } catch (err) {
      result.jobs_fetch_error = err instanceof Error ? err.message : String(err)
    }
  }

  return NextResponse.json(result, { status: 200 })
}
