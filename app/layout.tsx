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
    "מצאו את המשרה הבאה שלכם — חיפוש לפי אזור, היקף משרה ומודל עבודה, עם הגשת מועמדות מהירה באתר או בוואטסאפ.",
  keywords: ["דרושים", "משרות", "עבודה", "לוח דרושים", "חיפוש עבודה", "ג'וב מוש"],
  authors: [{ name: "ג'וב מוש" }],
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: SITE_URL,
    siteName: "ג'וב מוש",
    title: "ג'וב מוש · לוח הדרושים המוביל בישראל",
    description: "אלפי משרות מחברות מובילות. הגשת מועמדות מהירה באתר או בוואטסאפ.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ג'וב מוש · לוח הדרושים המוביל בישראל",
    description: "אלפי משרות מחברות מובילות. הגשת מועמדות מהירה.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#163300',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        <AccessibilityMenu />
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
