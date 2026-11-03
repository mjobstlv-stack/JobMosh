import { get } from "@vercel/blob"
import { INITIAL_CATEGORIES, INITIAL_JOBS, type Category, type Job } from "@/lib/job-board-data"

const JOBS_BLOB_PATH = "config/jobs.json"
const CATEGORIES_BLOB_PATH = "config/categories.json"

async function readBlobArray<T>(path: string, fallback: T[]): Promise<T[]> {
  try {
    const result = await get(path, { access: "private" })
    if (!result) return fallback
    const text = await new Response(result.stream).text()
    const data: unknown = JSON.parse(text)
    return Array.isArray(data) ? (data as T[]) : fallback
  } catch {
    return fallback
  }
}

export function getLiveJobs(): Promise<Job[]> {
  return readBlobArray(JOBS_BLOB_PATH, INITIAL_JOBS)
}

export function getLiveCategories(): Promise<Category[]> {
  return readBlobArray(CATEGORIES_BLOB_PATH, INITIAL_CATEGORIES)
}
