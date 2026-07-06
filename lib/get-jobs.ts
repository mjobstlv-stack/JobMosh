import { get } from "@vercel/blob"
import { INITIAL_JOBS, type Job } from "@/lib/job-board-data"

const JOBS_BLOB_PATH = "config/jobs.json"

export async function getLiveJobs(): Promise<Job[]> {
  try {
    const result = await get(JOBS_BLOB_PATH, { access: "private" })
    if (!result) return INITIAL_JOBS
    const text = await new Response(result.stream).text()
    const data: unknown = JSON.parse(text)
    return Array.isArray(data) ? (data as Job[]) : INITIAL_JOBS
  } catch {
    return INITIAL_JOBS
  }
}
