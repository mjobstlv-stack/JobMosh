import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export const metadata: Metadata = {
  title: "תנאי שירות",
  description: "תנאי השירות של ג'וב מוש — לוח הדרושים המוביל בישראל.",
  robots: { index: false },
}

export default function TermsPage() {
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
        <h1 className="mb-2 text-3xl font-bold text-foreground">תנאי שירות</h1>
        <p className="mb-10 text-sm text-muted-foreground">עדכון אחרון: יולי 2026</p>

        <div className="space-y-8 text-base leading-relaxed text-foreground">
          <Section title="1. קבלת התנאים">
            השימוש באתר ג&apos;וב מוש (jobmosh.co.il) מהווה הסכמה מלאה לתנאי שירות אלו. אם אינך
            מסכים/ה לתנאים, אנא הפסק/י את השימוש באתר.
          </Section>

          <Section title="2. תיאור השירות">
            <p>ג&apos;וב מוש הוא לוח משרות בעברית המיועד לדוברי עברית בישראל. האתר מאפשר:</p>
            <ul className="mt-3 list-disc space-y-1.5 pr-5 text-muted-foreground">
              <li>צפייה במשרות פתוחות</li>
              <li>הגשת מועמדות אלקטרונית למשרות</li>
              <li>לחברות ומעסיקים: ניהול משרות ומועמדויות דרך פאנל ניהול</li>
            </ul>
          </Section>

          <Section title="3. הגשת מועמדות">
            <ul className="list-disc space-y-2 pr-5 text-muted-foreground">
              <li>בהגשת מועמדות אתה/את מאשר/ת כי המידע שמסרת מדויק ואמיתי.</li>
              <li>
                האתר אינו אחראי לאופן שבו מעסיקים מטפלים במועמדויות, לתוצאות תהליכי גיוס, או
                לאמינות פרסומי המשרות.
              </li>
              <li>
                אין לשלוח קבצים המכילים נוזקות, תוכן פוגעני, פרטים מזויפים, או מידע על אדם אחר
                ללא הסכמתו.
              </li>
            </ul>
          </Section>

          <Section title="4. תוכן מעסיקים">
            <ul className="list-disc space-y-2 pr-5 text-muted-foreground">
              <li>
                המשרות באתר מפורסמות על-ידי מעסיקים בלבד. ג&apos;וב מוש אינה אחראית לתוכן,
                לדיוק, לחוקיות או להוגנות פרסומי המשרות.
              </li>
              <li>
                אנו שומרים לעצמנו את הזכות להסיר פרסום כלשהו לפי שיקול דעתנו הבלעדי.
              </li>
            </ul>
          </Section>

          <Section title="5. הגבלות שימוש">
            <p>חל איסור מוחלט על:</p>
            <ul className="mt-3 list-disc space-y-1.5 pr-5 text-muted-foreground">
              <li>איסוף נתונים מהאתר בכלי אוטומטי (scraping, crawling) ללא הרשאה בכתב</li>
              <li>הצגת תוכן האתר במסגרת (iframe) ללא הרשאה</li>
              <li>שימוש מסחרי בתוכן האתר ללא הסכמה</li>
              <li>הפרעה לפעילות תקינה של האתר</li>
            </ul>
          </Section>

          <Section title="6. קניין רוחני">
            עיצוב האתר, הלוגו, ושם &quot;ג&apos;וב מוש&quot; הם קניינה של החברה. אין לעשות
            שימוש בהם ללא רשות בכתב. תכני המשרות שייכים למפרסמיהם.
          </Section>

          <Section title="7. הגבלת אחריות">
            האתר ניתן &quot;כפי שהוא&quot; (AS IS). החברה אינה אחראית לנזקים ישירים, עקיפים,
            מקריים או תוצאתיים הנובעים משימוש באתר, לרבות: אובדן הזדמנות עבודה, הסתמכות על
            פרטי משרה שגויים, או הפסקת השירות.
          </Section>

          <Section title="8. זמינות השירות">
            אנו שואפים לזמינות גבוהה, אך איננו מתחייבים לזמינות רציפה. ייתכנו הפסקות לצורך
            תחזוקה.
          </Section>

          <Section title="9. שינויים בתנאים">
            נוכל לשנות תנאים אלו בכל עת. נודיע על שינויים מהותיים בדף הבית. המשך שימוש לאחר
            הפרסום מהווה הסכמה.
          </Section>

          <Section title="10. דין וסמכות שיפוט">
            תנאים אלו כפופים לדיני מדינת ישראל. לכל מחלוקת תהיה סמכות שיפוט בלעדית לבתי
            המשפט במחוז תל-אביב-יפו.
          </Section>

          <div className="border-t border-border pt-6 text-sm text-muted-foreground">
            לפניות:{" "}
            <a href="mailto:mjobstlv@gmail.com" className="text-primary underline">
              mjobstlv@gmail.com
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-foreground">{title}</h2>
      <div className="text-muted-foreground">{children}</div>
    </section>
  )
}
