import { AdminClient } from "@/components/admin/admin-client"

export const dynamic = "force-dynamic"

// Reached only via the ADMIN_HOST rewrite in proxy.ts; /panel on the public
// host returns 404. No data is rendered server-side here: the client loads it
// from the API only after login, so nothing private reaches an anonymous visitor.
export default function PanelPage() {
  return <AdminClient />
}
