import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ReactNode } from "react"
import { SITE_URL } from "@/lib/site"

export type Crumb = { name: string; href: string }

/** Shared frame for SEO landing pages: slim header, breadcrumbs, hero, content, footer links. */
export function LandingShell({
  crumbs,
  title,
  intro,
  jsonLd,
  children,
}: {
  crumbs: Crumb[]
  title: string
  intro: ReactNode
  jsonLd: object[]
  children: ReactNode
}) {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.href === "/" ? "" : c.href}`,
    })),
  }

  return (
    <>
      {[breadcrumbLd, ...jsonLd].map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }}
        />
      ))}

      <div className="min-h-screen bg-background" dir="rtl">
        <header className="border-b border-border bg-card/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronRight className="size-4" />
              כל המשרות
            </Link>
            <Link href="/" className="font-heading text-base font-extrabold text-foreground">
              ג&apos;וב<span className="text-primary">מוש</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <nav aria-label="פירורי לחם" className="mb-5">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              {crumbs.map((c, i) => (
                <li key={c.href} className="flex items-center gap-1">
                  {i > 0 && <ChevronLeft className="size-3 opacity-60" aria-hidden />}
                  {i < crumbs.length - 1 ? (
                    <Link href={c.href} className="transition-colors hover:text-foreground">
                      {c.name}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-foreground">
                      {c.name}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <section className="mb-8 rounded-2xl bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
            <h1 className="text-balance font-heading text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h1>
            <div className="mt-3 max-w-2xl text-pretty text-sm leading-7 text-primary-foreground/80 sm:text-base">
              {intro}
            </div>
          </section>

          {children}
        </main>

        <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground/70">
          <div className="flex items-center justify-center gap-5">
            <Link href="/" className="hover:text-muted-foreground">דף הבית</Link>
            <Link href="/jobs" className="hover:text-muted-foreground">משרות לפי עיר ותחום</Link>
            <Link href="/about" className="hover:text-muted-foreground">אודות</Link>
          </div>
          <p className="mt-3">© {new Date().getFullYear()} ג&apos;וב מוש</p>
        </footer>
      </div>
    </>
  )
}

/** Pill links to sibling landing pages (internal linking). */
export function LinkChips({ title, links }: { title: string; links: { href: string; label: string; count: number }[] }) {
  if (links.length === 0) return null
  return (
    <section className="mt-10">
      <h2 className="mb-3 font-heading text-lg font-bold text-foreground">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {l.label} <span className="text-muted-foreground">({l.count})</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
