import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Heebo } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { AccessibilityMenu } from '@/components/accessibility-menu'
import './globals.css'

const heebo = Heebo({
  variable: '--font-geist-sans',
  subsets: ['hebrew', 'latin'],
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobmosh.co.il"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ג'וב מוש · לוח הדרושים המוביל בישראל",
    template: "%s | ג'וב מוש",
  },
  description:
    "מצאו את המשרה הבאה שלכם — חיפוש לפי אזור, היקף משרה ומודל עבודה. אלפי משרות פתוחות בישראל, הגשת מועמדות מהירה באתר או בוואטסאפ.",
  keywords: [
    "דרושים", "משרות", "חיפוש עבודה", "לוח דרושים", "לוח דרושים ישראל",
    "משרות פתוחות", "דרושים בישראל", "הצעות עבודה", "ג'וב מוש",
    "דרושים תל אביב", "דרושים מרכז", "דרושים עבודה מהבית", "jobs israel",
  ],
  authors: [{ name: "ג'וב מוש" }],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: SITE_URL,
    siteName: "ג'וב מוש",
    title: "ג'וב מוש · לוח הדרושים המוביל בישראל",
    description: "אלפי משרות מחברות מובילות. הגשת מועמדות מהירה באתר או בוואטסאפ.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "ג'וב מוש — לוח הדרושים המוביל בישראל",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ג'וב מוש · לוח הדרושים המוביל בישראל",
    description: "אלפי משרות מחברות מובילות. הגשת מועמדות מהירה.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#163300',
}

const jsonLdWebSite = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "ג'וב מוש",
      url: SITE_URL,
      inLanguage: "he-IL",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "ג'וב מוש",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      areaServed: "IL",
      address: {
        "@type": "PostalAddress",
        addressCountry: "IL",
      },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} bg-background light`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdWebSite).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <AccessibilityMenu />
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
