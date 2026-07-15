import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jobmosh.co.il"

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description: "מדיניות הפרטיות של ג'וב מוש — כיצד אנו אוספים ומעבדים מידע אישי.",
  robots: { index: false },
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    title: "מדיניות פרטיות | ג'וב מוש",
    description: "מדיניות הפרטיות של ג'וב מוש — כיצד אנו אוספים ומעבדים מידע אישי.",
    url: `${SITE_URL}/privacy`,
  },
}

export default function PrivacyPage() {
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
        <h1 className="mb-2 text-3xl font-bold text-foreground">מדיניות פרטיות</h1>
        <p className="mb-10 text-sm text-muted-foreground">עדכון אחרון: יולי 2026</p>

        <div className="space-y-8 text-base leading-relaxed text-foreground">
          <Section title="1. כללי">
            ברוכים הבאים לאתר ג&apos;וב מוש (להלן: &quot;האתר&quot;), הפועל בכתובת jobmosh.co.il. מדיניות זו מסבירה
            כיצד אנו אוספים, מעבדים, מאחסנים ומשתמשים במידע אישי שנמסר לנו, בהתאם לחוק הגנת
            הפרטיות, התשמ&quot;א-1981 ותיקון מס&apos; 13 לחוק (בתוקף מאוגוסט 2025).
          </Section>

          <Section title="2. מידע שאנו אוספים">
            <p>בעת הגשת מועמדות למשרה אנו אוספים:</p>
            <ul className="mt-3 list-disc space-y-1.5 pr-5 text-muted-foreground">
              <li>שם מלא</li>
              <li>מספר טלפון</li>
              <li>קורות חיים — קובץ PDF (רשות)</li>
              <li>הודעה חופשית (רשות)</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              המידע נמסר מרצון. אינך חייב/ת למסור אותו, אך ללא פרטים בסיסיים (שם וטלפון) לא ניתן
              להגיש מועמדות.
            </p>
          </Section>

          <Section title="3. מטרות העיבוד">
            <p>המידע ישמש אך ורק לצורך:</p>
            <ul className="mt-3 list-disc space-y-1.5 pr-5 text-muted-foreground">
              <li>העברת פרטי המועמדות למעסיק הרלוונטי</li>
              <li>שליחת הודעת אישור בדוא&quot;ל (דרך Resend)</li>
              <li>שמירת המועמדות לצורך ניהול פנימי של מעסיקים ומנהלי האתר</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              המידע לא יועבר לצדדים שלישיים שאינם המעסיק שאליו הוגשה המועמדות, למעט ספקי תשתית
              (Vercel, Resend) הפועלים בהתאם להסכמי עיבוד נתונים (DPA) מחייבים.
            </p>
          </Section>

          <Section title="4. בסיס משפטי לעיבוד">
            העיבוד מתבסס על הסכמתך המפורשת בעת הגשת המועמדות, ועל אינטרס לגיטימי של המעסיק לקבל
            פניות רלוונטיות.
          </Section>

          <Section title="5. אחסון ואבטחה">
            קבצי קורות החיים והנתונים מאוחסנים ב-Vercel Blob, בשרתים הממוקמים באיחוד האירופי ו/או
            בארצות הברית (Vercel Inc.). ישראל הכירה באיחוד האירופי כמדינה בעלת הגנת פרטיות נאותה.
            אנו נוקטים באמצעי אבטחה סבירים לצמצום הגישה למידע, לרבות הצפנה בהעברה ובאחסון.
          </Section>

          <Section title="6. שמירת מידע">
            מועמדויות יישמרו לתקופה של עד 12 חודשים מתאריך ההגשה, ולאחר מכן יימחקו, אלא אם כן
            נדרשת שמירה ארוכה יותר לצורך עניין משפטי.
          </Section>

          <Section title="7. עוגיות ואחסון מקומי">
            האתר עושה שימוש ב-localStorage לשמירת העדפות תצוגה בסיסיות בלבד (כגון: הגדרות נגישות).
            אין שימוש בעוגיות לצורכי פרסום, מעקב או ניתוח של צד שלישי.
          </Section>

          <Section title="8. זכויותיך">
            <p>בהתאם לחוק הגנת הפרטיות ותיקון 13:</p>
            <ul className="mt-3 list-disc space-y-1.5 pr-5 text-muted-foreground">
              <li><strong className="text-foreground">עיון</strong> — זכאי/ת לבקש לעיין במידע האישי המוחזק עליך.</li>
              <li><strong className="text-foreground">תיקון</strong> — זכאי/ת לדרוש תיקון מידע שגוי, לא שלם או לא מעודכן.</li>
              <li><strong className="text-foreground">מחיקה</strong> — זכאי/ת לבקש מחיקת המידע כאשר אין עוד צורך לגיטימי בשמירתו.</li>
              <li><strong className="text-foreground">התנגדות</strong> — זכאי/ת להתנגד לעיבוד המידע שלך.</li>
              <li>
                <strong className="text-foreground">פנייה לרשות</strong> — זכאי/ת להגיש תלונה לרשות להגנת הפרטיות.
              </li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              לממש את זכויותיך:{" "}
              <a href="mailto:info@jobmosh.co.il" className="text-primary underline">
                info@jobmosh.co.il
              </a>
              . נשיב תוך 30 ימים.
            </p>
          </Section>

          <Section title="9. קטינים">
            האתר אינו מיועד לבני/בנות פחות מ-16. אין לנו כוונה לאסוף מידע על קטינים.
          </Section>

          <Section title="10. שינויים במדיניות">
            נודיע על שינויים מהותיים באמצעות הודעה בולטת באתר. המשך השימוש לאחר פרסום מהווה הסכמה
            למדיניות המעודכנת.
          </Section>

          <div className="border-t border-border pt-6 text-sm text-muted-foreground">
            לפניות:{" "}
            <a href="mailto:info@jobmosh.co.il" className="text-primary underline">
              info@jobmosh.co.il
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
