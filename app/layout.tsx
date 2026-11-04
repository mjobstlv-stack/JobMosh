import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Heebo } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { AccessibilityMenu } from '@/components/accessibility-menu'
import { CookieNotice } from '@/components/cookie-notice'
import './globals.css'

const heebo = Heebo({
  variable: '--font-geist-sans',
  subsets: ['hebrew', 'latin'],
})

import { ANALYTICS_CONSENT_KEY, GA_MEASUREMENT_ID, SITE_URL } from "@/lib/site"

// Runs before gtag.js loads. Consent defaults to denied (Consent Mode v2); a returning
// visitor who already accepted in the cookie notice is upgraded immediately.
// Built only from our own constants (JSON-encoded), so it is safe to inline.
const GTAG_BOOTSTRAP = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});
try {
  if (localStorage.getItem(${JSON.stringify(ANALYTICS_CONSENT_KEY)}) === '"granted"') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
  }
} catch (e) {}
gtag('js', new Date());
gtag('config', ${JSON.stringify(GA_MEASUREMENT_ID)});
`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ג'וב מוש · לוח הדרושים המושלם בישראל",
    template: "%s | ג'וב מוש",
  },
  description:
    "מצאו את המשרה הבאה שלכם — חיפוש לפי אזור, היקף משרה ומודל עבודה. משרות נבחרות בישראל, הגשת מועמדות מהירה באתר או בוואטסאפ.",
  authors: [{ name: "ג'וב מוש" }],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: SITE_URL,
    siteName: "ג'וב מוש",
    title: "ג'וב מוש · לוח הדרושים המושלם בישראל",
    description: "משרות נבחרות מחברות מובילות. הגשת מועמדות מהירה באתר או בוואטסאפ.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "ג'וב מוש — לוח הדרושים המושלם בישראל",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ג'וב מוש · לוח הדרושים המושלם בישראל",
    description: "משרות נבחרות מחברות מובילות. הגשת מועמדות מהירה.",
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
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google tag (gtag.js) with Consent Mode — no analytics cookies until the visitor accepts. */}
            <script dangerouslySetInnerHTML={{ __html: GTAG_BOOTSTRAP }} />
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
          </>
        )}
      </head>
      <body className="font-sans antialiased">
        <div id="a11y-scope">{children}</div>
        <AccessibilityMenu />
        <CookieNotice />
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
