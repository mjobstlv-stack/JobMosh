import { AdminClient } from "@/components/admin/admin-client"
import { getLiveCategories, getLiveJobs } from "@/lib/get-jobs"
import { getSettings } from "@/lib/get-settings"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Reached only via the ADMIN_HOST rewrite in proxy.ts; /panel on the public
// host returns 404. Data is public anyway (same as the home page); every
// write/private read is authorized server-side in the API routes.
export default async function PanelPage() {
  const [jobs, categories, settings] = await Promise.all([
    getLiveJobs(),
    getLiveCategories(),
    getSettings(),
  ])
  return <AdminClient initialJobs={jobs} initialCategories={categories} initialSettings={settings} />
}
