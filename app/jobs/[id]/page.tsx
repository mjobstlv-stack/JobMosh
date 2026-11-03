import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getLiveCategories, getLiveJobs } from "@/lib/get-jobs"
import {
  formatHebrewDate,
  getJobSlug,
  type Job,
} from "@/lib/job-board-data"
import { formatSalary } from "@/lib/utils"
import { isSectionTitle, stripBullet, toJobPostingHtml, toPreview } from "@/lib/job-text"
import { SITE_NAME } from "@/lib/site"
import { categoryUrl, cityUrl, normalizeCity, toSlug } from "@/lib/landing-pages"
import { InlineText, JobDescription } from "@/components/job-board/job-description"
import {
  Briefcase,
  Building2,
  ChevronRight,
  Clock,
  MapPin,
  MessageCircle,
} from "lucide-react"
import { ApplyButton } from "@/components/job-board/apply-button"

export const runtime = "nodejs"
// Render on every request so newly-added jobs never 404
export const dynamic = "force-dynamic"

// ── helpers ────────────────────────────────────────────────────────────────

import { SITE_URL } from "@/lib/site"

const EMPLOYMENT_TYPE: Record<string, string> = {
  "משרה מלאה": "FULL_TIME",
  "משרה חלקית": "PART_TIME",
  משמרות: "OTHER",
  פרילנס: "CONTRACTOR",
  סטודנטים: "PART_TIME",
}

const JOB_LOCATION_TYPE: Record<string, string | undefined> = {
  מהמשרד: undefined,
  היברידי: "HYBRID",
  מהבית: "TELECOMMUTE",
}

// ── Next.js route exports ───────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const jobs = await getLiveJobs()
  const job: Job | undefined = jobs.find(
    (j) => (getJobSlug(j) === id || j.id === id) && j.status === "active"
  )
  // Throwing here (not just in the page) makes the response a real 404 before streaming starts.
  if (!job) notFound()

  // The root layout's title template already appends "| ג'וב מוש".
  const title = `${job.title} · ${job.company} · ${job.city}`
  const description = `${job.title} ב${job.company}, ${job.city}. ${toPreview(job.description, 140).slice(0, 140)}...`
  const url = `${SITE_URL}/jobs/${getJobSlug(job)}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: "he_IL",
      siteName: SITE_NAME,
      // A page-level openGraph replaces the layout's, so the share image must be repeated here.
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      images: [`${SITE_URL}/og-image.png`],
      title,
      description,
    },
  }
}

// ── Page component ──────────────────────────────────────────────────────────

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const jobs = await getLiveJobs()
  const job: Job | undefined = jobs.find(
    (j) => (getJobSlug(j) === id || j.id === id) && j.status === "active"
  )
  if (!job) notFound()

  const categories = (await getLiveCategories()).filter((c) =>
    job.categoryIds.includes(c.id),
  )

  const locationType = JOB_LOCATION_TYPE[job.workModel]
  const whatsappText = `היי, אני מעוניין/ת להגיש מועמדות למשרת ${job.title} ב${job.company} שפורסמה בג'וב מוש. אשמח לפרטים נוספים.`

  // JSON-LD — Google Jobs rich result
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: toJobPostingHtml(job.description, job.requirements),
    datePosted: job.postedAt,
    // No validThrough: jobs stay open until the admin archives them (archived jobs 404,
    // which tells Google the posting is gone). A fixed "postedAt + N days" date made
    // Google treat still-open jobs as expired and drop them from Google for Jobs.
    url: `${SITE_URL}/jobs/${getJobSlug(job)}`,
    identifier: {
      "@type": "PropertyValue",
      name: SITE_NAME,
      value: job.id,
    },
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.city,
        addressCountry: "IL",
      },
    },
    employmentType: EMPLOYMENT_TYPE[job.jobType] ?? "OTHER",
    ...(locationType ? { jobLocationType: locationType } : {}),
    directApply: job.allowSiteApply,
    ...(job.salary && job.salary.type !== "undisclosed"
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "ILS",
            value: {
              "@type": "QuantitativeValue",
              ...(job.salary.type === "range"
                ? { minValue: job.salary.min, maxValue: job.salary.max }
                : { minValue: job.salary.min }),
              unitText: job.salary.period,
            },
          },
        }
      : {}),
  }

  return (
    <>
      {/* JSON-LD structured data for Google Jobs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="min-h-screen bg-background" dir="rtl">
        {/* Slim top bar */}
        <header className="border-b border-border bg-card/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronRight className="size-4" />
              כל המשרות
            </Link>
            <Link
              href="/"
              className="font-heading text-base font-extrabold text-foreground"
            >
              ג'וב<span className="text-primary">מוש</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-10">
          {/* Job hero card */}
          <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Briefcase className="size-8" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold leading-tight text-foreground">
                  {job.title}
                </h1>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="size-3.5" />
                    {job.company}
                  </span>
                  {job.workModel !== "מהבית" && job.city?.trim() ? (
                    <Link
                      href={cityUrl(toSlug(normalizeCity(job.city)))}
                      className="flex items-center gap-1 transition-colors hover:text-primary"
                      title={`עוד משרות ב${normalizeCity(job.city)}`}
                    >
                      <MapPin className="size-3.5" />
                      {job.city}
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {job.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {formatHebrewDate(job.postedAt)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[job.jobType, job.workModel, job.region].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main body */}
            <div className="space-y-5 lg:col-span-2">
              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="mb-3 font-heading text-lg font-bold text-foreground">
                  תיאור המשרה
                </h2>
                <JobDescription text={job.description} size="base" />
              </section>

              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="mb-3 font-heading text-lg font-bold text-foreground">
                  דרישות התפקיד
                </h2>
                <ul className="space-y-2.5">
                  {job.requirements.filter((r) => !isSectionTitle(r)).map((req, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span><InlineText text={stripBullet(req)} /></span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Sticky sidebar */}
            <div>
              <div className="sticky top-6 space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                {job.salary && (
                  <div className="mb-3 rounded-xl bg-accent px-4 py-3">
                    <p className="text-xs text-muted-foreground">שכר</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {formatSalary(job.salary)}
                    </p>
                  </div>
                )}
                <h3 className="font-heading font-semibold text-foreground">
                  הגשת מועמדות
                </h3>

                <div className="flex flex-col gap-2.5">
                  {job.allowSiteApply && <ApplyButton job={job} />}
                  {job.allowWhatsApp && (
                    <a
                      href={`https://wa.me/${job.whatsappNumber}?text=${encodeURIComponent(whatsappText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 text-sm font-semibold text-green-700 transition-all hover:bg-green-100 active:scale-[0.98]"
                    >
                      <MessageCircle className="size-4" />
                      הגשה מהירה בוואטסאפ
                    </a>
                  )}
                </div>

                {categories.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="mb-2 text-xs text-muted-foreground">תחומים</p>
                    <div className="flex flex-wrap gap-1.5">
                      {categories.map((c) => (
                        <Link
                          key={c.id}
                          href={categoryUrl(toSlug(c.name))}
                          className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
