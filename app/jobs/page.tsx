import type { Metadata } from "next"
import Link from "next/link"
import { MapPin } from "lucide-react"
import { LandingShell } from "@/components/landing/landing-shell"
import { getCategoryIcon } from "@/lib/category-icons"
import { getLiveCategories, getLiveJobs } from "@/lib/get-jobs"
import {
  categoryUrl,
  cityUrl,
  getActiveJobs,
  getCategoryPages,
  getCityPages,
  jobsCountLabel,
  openJobsLabel,
} from "@/lib/landing-pages"
import { SITE_URL } from "@/lib/site"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "משרות לפי עיר ותחום",
  description:
    "כל המשרות הפתוחות בג'וב מוש לפי עיר ולפי תחום — דרושים בתל אביב, פתח תקווה, חיפה ועוד, במכירות, שירות לקוחות, לוגיסטיקה ועוד.",
  alternates: { canonical: `${SITE_URL}/jobs` },
}

export default async function JobsHubPage() {
  const [jobs, categories] = await Promise.all([getLiveJobs(), getLiveCategories()])
  const total = getActiveJobs(jobs).length
  const cities = getCityPages(jobs)
  const categoryPages = getCategoryPages(jobs, categories)

  return (
    <LandingShell
      crumbs={[
        { name: "דף הבית", href: "/" },
        { name: "משרות לפי עיר ותחום", href: "/jobs" },
      ]}
      title="משרות לפי עיר ותחום"
      intro={<p>{openJobsLabel(total)} כרגע. בחרו עיר או תחום כדי לראות את המשרות הרלוונטיות.</p>}
      jsonLd={[]}
    >
      <section>
        <h2 className="mb-4 font-heading text-xl font-bold text-foreground">דרושים לפי תחום</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categoryPages.map((c) => {
            const Icon = getCategoryIcon(c.category.icon)
            return (
              <Link
                key={c.slug}
                href={categoryUrl(c.slug)}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground group-hover:bg-primary/10">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-foreground">{c.category.name}</span>
                  <span className="block text-xs text-muted-foreground">{jobsCountLabel(c.jobs.length)}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-xl font-bold text-foreground">דרושים לפי עיר</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cities.map((c) => (
            <Link
              key={c.slug}
              href={cityUrl(c.slug)}
              className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <MapPin className="size-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block truncate font-semibold text-foreground">{c.name}</span>
                <span className="block text-xs text-muted-foreground">{jobsCountLabel(c.jobs.length)}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </LandingShell>
  )
}
