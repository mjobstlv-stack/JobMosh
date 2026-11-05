import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { JobListCard } from "@/components/landing/job-list-card"
import { LandingShell, LinkChips } from "@/components/landing/landing-shell"
import { getLiveCategories, getPublicJobs } from "@/lib/get-jobs"
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

type Params = { params: Promise<{ city: string }> }

async function load(param: string) {
  const [jobs, categories] = await Promise.all([getPublicJobs(), getLiveCategories()])
  const cities = getCityPages(jobs)
  const page = cities.find((c) => c.slug === decodeSlug(param))
  return { page, cities, categories, jobs }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { page } = await load((await params).city)
  // Throwing here (not just in the page) makes the response a real 404 before streaming starts.
  if (!page) notFound()

  const count = page.jobs.length
  const title = `דרושים ב${page.name} — ${openJobsLabel(count)}`
  const description = `${openJobsLabel(count)} ב${page.name}: ${page.jobs
    .slice(0, 4)
    .map((j) => j.title)
    .join(", ")}. הגשת מועמדות מהירה באתר או בוואטסאפ.`
  const url = `${SITE_URL}${cityUrl(page.slug)}`

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

export default async function CityPage({ params }: Params) {
  const { page, cities, categories, jobs } = await load((await params).city)
  if (!page) notFound()

  const count = page.jobs.length
  // Categories that appear among this city's jobs, for the intro and the chips.
  const cityCategoryPages = getCategoryPages(page.jobs, categories)
  const topFields = cityCategoryPages.slice(0, 3).map((c) => c.category.name)
  // Chips link to the site-wide category page, so show its total count.
  const totalByCategory = new Map(getCategoryPages(jobs, categories).map((c) => [c.slug, c.jobs.length]))

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `דרושים ב${page.name}`,
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
        { name: `דרושים ב${page.name}`, href: cityUrl(page.slug) },
      ]}
      title={`דרושים ב${page.name}`}
      intro={
        <p>
          {openJobsLabel(count)} כרגע ב{page.name}
          {topFields.length > 0 && <> — בתחומי {topFields.join(", ")}</>}. כל המשרות מעודכנות, ואפשר להגיש
          מועמדות ישירות באתר או בוואטסאפ.
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
        title={`תחומים ב${page.name}`}
        links={cityCategoryPages.map((c) => ({
          href: categoryUrl(c.slug),
          label: c.category.name,
          count: totalByCategory.get(c.slug) ?? c.jobs.length,
        }))}
      />

      <LinkChips
        title="דרושים בערים נוספות"
        links={cities
          .filter((c) => c.slug !== page.slug)
          .map((c) => ({ href: cityUrl(c.slug), label: c.name, count: c.jobs.length }))}
      />
    </LandingShell>
  )
}
