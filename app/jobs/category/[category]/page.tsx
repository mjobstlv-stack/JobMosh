import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { JobListCard } from "@/components/landing/job-list-card"
import { LandingShell, LinkChips } from "@/components/landing/landing-shell"
import { getLiveCategories, getLiveJobs } from "@/lib/get-jobs"
import { getJobSlug } from "@/lib/job-board-data"
import {
  MIN_JOBS_TO_INDEX,
  categoryUrl,
  cityUrl,
  decodeSlug,
  getCategoryPages,
  getCityPages,
  jobsCountLabel,
  openJobsLabel,
} from "@/lib/landing-pages"
import { SITE_URL } from "@/lib/site"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Params = { params: Promise<{ category: string }> }

async function load(param: string) {
  const [jobs, categories] = await Promise.all([getLiveJobs(), getLiveCategories()])
  const categoryPages = getCategoryPages(jobs, categories)
  const page = categoryPages.find((c) => c.slug === decodeSlug(param))
  return { page, categoryPages, categories, jobs }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { page } = await load((await params).category)
  // Throwing here (not just in the page) makes the response a real 404 before streaming starts.
  if (!page) notFound()

  const name = page.category.name
  const count = page.jobs.length
  const title = `דרושים ב${name} — ${openJobsLabel(count)}`
  const description = `${jobsCountLabel(count)} בתחום ${name}: ${page.jobs
    .slice(0, 4)
    .map((j) => `${j.title} (${j.city})`)
    .join(", ")}. הגשת מועמדות מהירה באתר או בוואטסאפ.`
  const url = `${SITE_URL}${categoryUrl(page.slug)}`

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: count >= MIN_JOBS_TO_INDEX ? undefined : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: "he_IL",
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
    },
  }
}

export default async function CategoryPage({ params }: Params) {
  const { page, categoryPages, categories, jobs } = await load((await params).category)
  if (!page) notFound()

  const name = page.category.name
  const count = page.jobs.length
  // Cities among this field's jobs, for the intro and the chips.
  const fieldCities = getCityPages(page.jobs)
  const topCities = fieldCities.slice(0, 3).map((c) => c.name)
  const totalByCity = new Map(getCityPages(jobs).map((c) => [c.slug, c.jobs.length]))

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `דרושים ב${name}`,
    numberOfItems: count,
    itemListElement: page.jobs.map((j, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/jobs/${getJobSlug(j)}`,
      name: j.title,
    })),
  }

  return (
    <LandingShell
      crumbs={[
        { name: "דף הבית", href: "/" },
        { name: "משרות לפי עיר ותחום", href: "/jobs" },
        { name: `דרושים ב${name}`, href: categoryUrl(page.slug) },
      ]}
      title={`דרושים ב${name}`}
      intro={
        <p>
          {openJobsLabel(count)} כרגע בתחום {name}
          {topCities.length > 0 && <> — ב{topCities.join(", ב")}</>}. כל המשרות מעודכנות, ואפשר להגיש מועמדות
          ישירות באתר או בוואטסאפ.
        </p>
      }
      jsonLd={[itemListLd]}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {page.jobs.map((job) => (
          <JobListCard key={job.id} job={job} categories={categories} />
        ))}
      </div>

      <LinkChips
        title={`${name} לפי עיר`}
        links={fieldCities.map((c) => ({
          href: cityUrl(c.slug),
          label: c.name,
          count: totalByCity.get(c.slug) ?? c.jobs.length,
        }))}
      />

      <LinkChips
        title="תחומים נוספים"
        links={categoryPages
          .filter((c) => c.slug !== page.slug)
          .map((c) => ({ href: categoryUrl(c.slug), label: c.category.name, count: c.jobs.length }))}
      />
    </LandingShell>
  )
}
