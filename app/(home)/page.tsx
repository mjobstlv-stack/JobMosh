import { HomeClient } from "@/components/job-board/home-client"
import { getLiveCategories, getLiveJobs } from "@/lib/get-jobs"

export const runtime = "nodejs"
// Server-render the live listings on every request so crawlers (and first paint)
// see the real jobs, not the client-side demo placeholders.
export const dynamic = "force-dynamic"

export default async function Page() {
  const [jobs, categories] = await Promise.all([getLiveJobs(), getLiveCategories()])
  return <HomeClient initialJobs={jobs} initialCategories={categories} />
}
