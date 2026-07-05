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

  // Find all BLOB-related env vars
  const blobEnvVars = Object.entries(process.env)
    .filter(([k]) => k.startsWith("BLOB"))
    .reduce<Record<string, string>>((acc, [k, v]) => {
      acc[k] = v ? v.slice(0, 12) + "..." : "null"
      return acc
    }, {})

  const result: Record<string, unknown> = {
    env_token_set: !!process.env.BLOB_READ_WRITE_TOKEN,
    blob_env_vars: blobEnvVars,
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

  // Show VERCEL_OIDC_TOKEN presence
  result.oidc_token_set = !!process.env.VERCEL_OIDC_TOKEN
  result.oidc_token_prefix = process.env.VERCEL_OIDC_TOKEN?.slice(0, 12) ?? null
  result.blob_store_id = process.env.BLOB_STORE_ID ?? null

  // Try fetching the jobs blob if found — try with OIDC token as Bearer
  const configBlobs = result.config_blobs as Array<{ url: string; downloadUrl: string; pathname: string }> | undefined
  const jobsBlob = configBlobs?.find((b) => b.pathname.startsWith("config/jobs"))
  if (jobsBlob) {
    const oidcToken = process.env.VERCEL_OIDC_TOKEN
    const rwToken = process.env.BLOB_READ_WRITE_TOKEN
    const authToken = rwToken ?? oidcToken

    const headers: Record<string, string> = {}
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`
    result.auth_method = rwToken ? "BLOB_READ_WRITE_TOKEN" : oidcToken ? "VERCEL_OIDC_TOKEN" : "none"

    try {
      // Try blob base URL (without ?download=1)
      const res = await fetch(jobsBlob.url, { headers, cache: "no-store" } as RequestInit)
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
