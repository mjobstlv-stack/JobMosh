// Google Indexing API — tells Google immediately when a job page is published,
// changed or closed, instead of waiting for the next crawl. Google officially
// supports this API for pages with JobPosting structured data.
//
// Setup: put the service-account JSON key in the GOOGLE_INDEXING_CREDENTIALS env var
// (Vercel → Settings → Environment Variables) and add the service account's email
// as an Owner of the property in Search Console. Without the env var this is a no-op.
import { createSign } from "node:crypto"
import { getJobSlug, type Job } from "@/lib/job-board-data"
import { SITE_URL } from "@/lib/site"

type ServiceAccount = { client_email: string; private_key: string }
export type IndexingAction = { url: string; type: "URL_UPDATED" | "URL_DELETED" }

// Default quota is 200 publish requests/day; one save should never burn a big chunk of it.
const MAX_NOTIFICATIONS_PER_SAVE = 50

function readCredentials(): ServiceAccount | null {
  const raw = process.env.GOOGLE_INDEXING_CREDENTIALS
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>
    if (!parsed.client_email || !parsed.private_key) return null
    // Env UIs often store the key's newlines as literal "\n".
    return { client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, "\n") }
  } catch {
    console.error("[indexing] GOOGLE_INDEXING_CREDENTIALS is not valid JSON")
    return null
  }
}

const base64url = (input: string | Buffer) => Buffer.from(input).toString("base64url")

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const claims = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/indexing",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  )
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(sa.private_key)
  const assertion = `${header}.${claims}.${base64url(signature)}`

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  })
  if (!res.ok) throw new Error(`token request failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

// Fields that change what Google shows for the posting.
const SIGNIFICANT_FIELDS: (keyof Job)[] = [
  "title", "company", "city", "region", "jobType", "workModel", "description", "requirements", "salary", "slug",
]

function jobUrl(job: Job): string {
  return `${SITE_URL}/jobs/${encodeURI(getJobSlug(job))}`
}

/** Which job URLs Google should hear about after the job list changed from `prev` to `next`. */
export function diffJobsForIndexing(prev: Job[], next: Job[]): IndexingAction[] {
  const prevById = new Map(prev.map((j) => [j.id, j]))
  const nextById = new Map(next.map((j) => [j.id, j]))
  const actions: IndexingAction[] = []

  for (const job of next) {
    if (job.status !== "active") continue
    const before = prevById.get(job.id)
    const changed =
      !before ||
      before.status !== "active" ||
      SIGNIFICANT_FIELDS.some((f) => JSON.stringify(before[f]) !== JSON.stringify(job[f]))
    if (changed) actions.push({ url: jobUrl(job), type: "URL_UPDATED" })
    // A slug change moves the page — the old URL is gone.
    if (before && before.status === "active" && getJobSlug(before) !== getJobSlug(job)) {
      actions.push({ url: jobUrl(before), type: "URL_DELETED" })
    }
  }

  for (const job of prev) {
    if (job.status !== "active") continue
    const after = nextById.get(job.id)
    if (!after || after.status !== "active") actions.push({ url: jobUrl(job), type: "URL_DELETED" })
  }

  return actions
}

/** Sends the notifications; never throws (indexing must not break saving jobs). */
export async function notifyGoogle(actions: IndexingAction[]): Promise<void> {
  if (actions.length === 0) return
  const sa = readCredentials()
  if (!sa) return

  try {
    const token = await getAccessToken(sa)
    const batch = actions.slice(0, MAX_NOTIFICATIONS_PER_SAVE)
    const results = await Promise.allSettled(
      batch.map(async (action) => {
        const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(action),
        })
        if (!res.ok) throw new Error(`${action.type} ${action.url}: ${res.status} ${await res.text()}`)
      }),
    )
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected")
    console.log(`[indexing] sent ${batch.length - failed.length}/${batch.length}`)
    for (const f of failed) console.error("[indexing]", f.reason instanceof Error ? f.reason.message : f.reason)
  } catch (err) {
    console.error("[indexing]", err instanceof Error ? err.message : err)
  }
}
