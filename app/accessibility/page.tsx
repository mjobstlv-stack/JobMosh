import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jobmosh.co.il"

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description: "הצהרת נגישות של ג'וב מוש בהתאם לתקן ישראלי 5568.",
  alternates: { canonical: `${SITE_URL}/accessibility` },
}

export default function AccessibilityPage() {
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
            ג&apos;וב<span className="text-primary">מוש</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold text-foreground">הצהרת נגישות</h1>
        <p className="mb-8 text-sm text-muted-foreground">עודכן לאחרונה: יולי 2026</p>

        <div className="space-y-8 text-foreground/80 leading-relaxed">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">כללי</h2>
            <p>
              ג&apos;וב מוש (<a href="https://www.jobmosh.co.il" className="text-primary underline">www.jobmosh.co.il</a>)
              שואפת לאפשר שימוש שווה ונוח לכל אדם, כולל אנשים עם מוגבלות, בהתאם
              לחוק שוויון זכויות לאנשים עם מוגבלות, תשנ&quot;ח–1998, ותקן ישראלי 5568.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">רמת הנגישות</h2>
            <p className="mb-2">
              האתר עומד ברמת נגישות AA בהתאם לתקן WCAG 2.1, באופן חלקי. פעלנו להנגשת האתר בין היתר ב:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>תמיכה בקורא מסך</li>
              <li>ניווט מקלדת מלא</li>
              <li>תגיות ARIA מתאימות</li>
              <li>כפתור נגישות לשינוי גופן וניגוד צבעים</li>
              <li>תמיכה בכיוון RTL מלא</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">פערים ידועים</h2>
            <p>
              חלק מהתכנים שנוצרו על ידי גורמים חיצוניים עשויים שלא להיות נגישים במלואם.
              אנו עובדים על שיפור מתמיד של נגישות האתר.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">יצירת קשר בנושא נגישות</h2>
            <p className="mb-2">נתקלתם בבעיית נגישות? נשמח לשמוע ולתקן:</p>
            <ul className="space-y-1">
              <li>
                מייל:{" "}
                <a href="mailto:info@jobmosh.co.il" className="text-primary underline">
                  info@jobmosh.co.il
                </a>
              </li>
              <li>נושא: &quot;בקשת נגישות&quot;</li>
              <li>זמן מענה: עד 5 ימי עסקים</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}
