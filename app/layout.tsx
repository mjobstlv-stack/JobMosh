import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Heebo } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const heebo = Heebo({
  variable: '--font-geist-sans',
  subsets: ['hebrew', 'latin'],
})

export const metadata: Metadata = {
  title: 'דרושים פלוס · לוח הדרושים המוביל בישראל',
  description:
    'מצאו את המשרה הבאה שלכם — חיפוש לפי אזור, היקף משרה ומודל עבודה, עם הגשת מועמדות מהירה באתר או בוואטסאפ.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#4f46e5',
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
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
