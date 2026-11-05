import { NextResponse, after } from "next/server"
import { list, put, del, get } from "@vercel/blob"
import { requireAdminPermission } from "@/lib/admin-auth"
import { INITIAL_JOBS, type Job } from "@/lib/job-board-data"
import { getLiveJobs, toPublicJobs } from "@/lib/get-jobs"
import { diffJobsForIndexing, notifyGoogle } from "@/lib/google-indexing"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BLOB_PATH = "config/jobs.json"

export async function GET() {
  let jobs: Job[] = INITIAL_JOBS
  try {
    const result = await get(BLOB_PATH, { access: "private" })
    if (result) {
      const data = JSON.parse(await new Response(result.stream).text())
      if (Array.isArray(data)) jobs = data
    }
  } catch {
    // fall back to INITIAL_JOBS
  }
  // Only admins with the jobs permission see non-active jobs and private fields.
  const isAdmin = (await requireAdminPermission("jobs")).ok
  return NextResponse.json(isAdmin ? jobs : toPublicJobs(jobs))
}

export async function POST(req: Request) {
  const auth = await requireAdminPermission("jobs")
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let jobs: unknown
  try {
    jobs = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  if (!Array.isArray(jobs)) {
    return NextResponse.json({ error: "Expected array" }, { status: 400 })
  }

  try {
    // Snapshot before overwriting, to tell Google which job pages changed.
    const previous = await getLiveJobs()
    const { blobs } = await list({ prefix: BLOB_PATH })
    await Promise.all(blobs.map((b) => del(b.url)))
    await put(BLOB_PATH, JSON.stringify(jobs), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
    })
    // Runs after the response is sent, so the admin never waits on Google.
    // If the old list couldn't be read (demo fallback), there's nothing reliable to diff against.
    if (previous !== INITIAL_JOBS) {
      after(() => notifyGoogle(diffJobsForIndexing(previous, jobs as Job[])))
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
