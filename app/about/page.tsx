import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jobmosh.co.il"

export const metadata: Metadata = {
  title: "אודות",
  description: "ג'וב מוש — לוח דרושים ישראלי המתמקד בהגשת מועמדות מהירה דרך האתר ובוואטסאפ.",
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: "אודות | ג'וב מוש",
    description: "ג'וב מוש — לוח דרושים ישראלי המתמקד בהגשת מועמדות מהירה דרך האתר ובוואטסאפ.",
    url: `${SITE_URL}/about`,
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronRight className="size-4" />
            חזרה לדף הבית
          </Link>
          <Link href="/" className="font-heading text-base font-extrabold text-foreground">
            ג'וב<span className="text-primary">מוש</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold text-foreground">אודות ג'וב מוש</h1>
        <p className="mb-10 text-sm text-muted-foreground">לוח הדרושים המושלם בישראל</p>

        <div className="space-y-8 text-foreground/80 leading-relaxed">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">מה אנחנו?</h2>
            <p>
              ג'וב מוש הוא לוח דרושים ישראלי המציע חוויית הגשת מועמדות מהירה ונוחה — ישירות
              דרך האתר או בוואטסאפ, בלחיצת כפתור. אנחנו מאמינים שמציאת עבודה לא צריכה להיות
              תהליך מסורבל.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">המשרות שלנו</h2>
            <p>
              אנחנו מפרסמים משרות נבחרות בתחומים מגוונים — הייטק, עיצוב, רפואה, מכירות, שיווק
              ועוד. כל משרה נבדקת לפני פרסומה כדי להבטיח שמועמדים יגיעו להזדמנויות אמיתיות
              ורלוונטיות.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">למעסיקים</h2>
            <p className="mb-3">
              ג'וב מוש הוא פלטפורמה דו-צדדית. מעסיקים המעוניינים לפרסם משרה מגיעים לקהל רחב
              דרך האתר, הטלגרם, הוואטסאפ והאינסטגרם שלנו.
            </p>
            <a
              href="mailto:info@jobmosh.co.il?subject=פרסום%20משרה"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
            >
              צרו קשר לפרסום משרה
            </a>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">יצירת קשר</h2>
            <ul className="space-y-1">
              <li>
                מייל:{" "}
                <a href="mailto:info@jobmosh.co.il" className="text-primary underline">
                  info@jobmosh.co.il
                </a>
              </li>
              <li>זמן מענה: עד 2 ימי עסקים</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}
