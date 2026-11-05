import { HomeClient } from "@/components/job-board/home-client"
import { getLiveCategories, getLiveJobs } from "@/lib/get-jobs"
import { getSettings } from "@/lib/get-settings"

export const runtime = "nodejs"
// Server-render the live listings on every request so crawlers (and first paint)
// see the real jobs, not the client-side demo placeholders.
export const dynamic = "force-dynamic"

export default async function Page() {
  const [jobs, categories, settings] = await Promise.all([
    getLiveJobs(),
    getLiveCategories(),
    getSettings(),
  ])
  return <HomeClient initialJobs={jobs} initialCategories={categories} initialSettings={settings} />
}
