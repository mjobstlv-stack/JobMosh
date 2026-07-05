// ===== Domain types & seed data for the Hebrew job board =====

export const REGIONS = [
  "צפון",
  "חיפה והקריות",
  "עמקים וגליל",
  "השרון",
  "גוש דן ותל אביב",
  "מרכז",
  "שפלה",
  "ירושלים והסביבה",
  "יהודה ושומרון",
  "דרום",
  "באר שבע והנגב",
  "אילת והערבה",
  "עבודה מהבית",
] as const

export const JOB_TYPES = [
  "משרה מלאה",
  "משרה חלקית",
  "משמרות",
  "פרילנס",
  "סטודנטים",
] as const

export const WORK_MODELS = ["מהמשרד", "היברידי", "מהבית"] as const

export type Region = (typeof REGIONS)[number]
export type JobType = (typeof JOB_TYPES)[number]
export type WorkModel = (typeof WORK_MODELS)[number]
export type JobStatus = "active" | "draft" | "archived"

export type SalaryPeriod = 'HOUR' | 'MONTH'

export type Salary =
  | { type: 'range';       min: number; max: number; period: SalaryPeriod }
  | { type: 'minimum';     min: number;              period: SalaryPeriod }
  | { type: 'undisclosed' }

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  active: "פעילה",
  draft: "טיוטה",
  archived: "בארכיון",
}

export type Category = {
  id: string
  name: string
  icon: string // key into ICON_REGISTRY
}

export type Job = {
  id: string
  title: string
  company: string
  region: Region
  jobType: JobType
  workModel: WorkModel
  city: string
  description: string
  requirements: string[]
  categoryIds: string[]
  status: JobStatus
  allowSiteApply: boolean
  allowWhatsApp: boolean
  whatsappNumber: string
  postedAt: string // ISO date
  salary?: Salary
  notificationEmail?: string
}

export type Application = {
  id: string
  jobId: string
  jobTitle: string
  name: string
  phone: string
  message: string
  date: string // ISO date
  cvFileName?: string
  cvDataUrl?: string
}

export type GlobalSettings = {
  jobAlertsEnabled: boolean
  navJobsVisible: boolean
  navJobsLabel: string
  navCompaniesVisible: boolean
  navCompaniesLabel: string
  navCareersVisible: boolean
  navCareersLabel: string
}

// The set of icons the admin can pick from when creating a category.
export const ICON_OPTIONS = [
  "code",
  "palette",
  "stethoscope",
  "graduation",
  "sales",
  "engineering",
  "food",
  "logistics",
  "marketing",
  "finance",
  "support",
  "legal",
  "realestate",
  "briefcase",
  "fashion",
  "warehouse",
] as const

export type IconKey = (typeof ICON_OPTIONS)[number]

export const ICON_LABELS: Record<IconKey, string> = {
  code: "טכנולוגיה",
  palette: "עיצוב",
  stethoscope: "רפואה",
  graduation: "חינוך",
  sales: "מכירות",
  engineering: "הנדסה",
  food: "מסעדנות",
  logistics: "לוגיסטיקה",
  marketing: "שיווק",
  finance: "כספים",
  support: "שירות",
  legal: "משפטים",
  realestate: "נדל\u05F4ן",
  briefcase: "כללי",
  fashion: "אופנה",
  warehouse: "מחסנאות",
}

export const INITIAL_CATEGORIES: Category[] = [
  { id: "cat-tech", name: "הייטק וטכנולוגיה", icon: "code" },
  { id: "cat-design", name: "עיצוב ו-UI/UX", icon: "palette" },
  { id: "cat-health", name: "רפואה ובריאות", icon: "stethoscope" },
  { id: "cat-sales", name: "מכירות ועסקים", icon: "sales" },
  { id: "cat-marketing", name: "שיווק ודיגיטל", icon: "marketing" },
  { id: "cat-finance", name: "כספים וחשבונאות", icon: "finance" },
  { id: "cat-eng", name: "הנדסה ותעשייה", icon: "engineering" },
  { id: "cat-service", name: "שירות לקוחות", icon: "support" },
]

export const INITIAL_JOBS: Job[] = [
  {
    id: "job-1",
    title: "מפתח/ת Full Stack בכיר/ה",
    company: "נובה טכנולוגיות",
    region: "מרכז",
    jobType: "משרה מלאה",
    workModel: "היברידי",
    city: "תל אביב",
    description:
      "אנחנו מחפשים מפתח/ת Full Stack מנוסה שיצטרף/תצטרף לצוות הליבה שלנו ויוביל/תוביל פיתוח של מוצרי SaaS חדשניים. תעבדו בסביבה מודרנית עם React, Node.js ו-PostgreSQL.",
    requirements: [
      "ניסיון של 4+ שנים בפיתוח Full Stack",
      "שליטה מעולה ב-React ו-TypeScript",
      "ניסיון בבניית APIs ב-Node.js",
      "היכרות עם בסיסי נתונים רלציוניים",
    ],
    categoryIds: ["cat-tech"],
    status: "active",
    allowSiteApply: true,
    allowWhatsApp: true,
    whatsappNumber: "972541234567",
    postedAt: "2026-06-10",
    salary: { type: 'range', min: 12000, max: 18000, period: 'MONTH' },
  },
  {
    id: "job-2",
    title: "מעצב/ת מוצר UX/UI",
    company: "סטודיו פיקסל",
    region: "מרכז",
    jobType: "משרה מלאה",
    workModel: "מהמשרד",
    city: "הרצליה",
    description:
      "סטודיו פיקסל מגייס מעצב/ת מוצר מוכשר/ת לעיצוב חוויות דיגיטליות עבור לקוחות מובילים. תהיו אחראים על כל מסע המשתמש מהמחקר ועד הפיקסל האחרון.",
    requirements: [
      "תיק עבודות מרשים",
      "שליטה ב-Figma",
      "חשיבה מוצרית וחווית משתמש",
      "יכולת עבודה בצוות",
    ],
    categoryIds: ["cat-design", "cat-tech"],
    status: "active",
    allowSiteApply: true,
    allowWhatsApp: false,
    whatsappNumber: "972541234567",
    postedAt: "2026-06-11",
    salary: { type: 'minimum', min: 45, period: 'HOUR' },
  },
  {
    id: "job-3",
    title: "אח/ות מוסמך/ת",
    company: "מרכז רפואי הדס",
    region: "צפון",
    jobType: "משמרות",
    workModel: "מהמשרד",
    city: "חיפה",
    description:
      "המרכז הרפואי הדס מחפש אחים ואחיות מסורים/ות למחלקה הפנימית. סביבת עבודה תומכת, אפשרויות קידום והכשרות מקצועיות.",
    requirements: [
      "תעודת אח/ות מוסמך/ת",
      "רישיון בתוקף ממשרד הבריאות",
      "יחס חם למטופלים",
      "נכונות לעבודה במשמרות",
    ],
    categoryIds: ["cat-health"],
    status: "active",
    allowSiteApply: false,
    allowWhatsApp: true,
    whatsappNumber: "972521234567",
    postedAt: "2026-06-09",
    salary: { type: 'undisclosed' },
  },
  {
    id: "job-4",
    title: "מנהל/ת תיקי לקוחות",
    company: "גלובל סייל",
    region: "מרכז",
    jobType: "משרה מלאה",
    workModel: "היברידי",
    city: "רמת גן",
    description:
      "תפקיד מכירות אסטרטגי הכולל ניהול מערכות יחסים עם לקוחות מפתח, סגירת עסקאות והגדלת תיק הלקוחות. בונוסים אטרקטיביים ורכב צמוד.",
    requirements: [
      "ניסיון של 3+ שנים במכירות B2B",
      "כושר ביטוי ויכולת שכנוע",
      "אנגלית ברמה גבוהה",
      "ראש גדול ומוטיבציה",
    ],
    categoryIds: ["cat-sales"],
    status: "active",
    allowSiteApply: true,
    allowWhatsApp: true,
    whatsappNumber: "972531234567",
    postedAt: "2026-06-08",
    salary: { type: 'range', min: 8000, max: 11000, period: 'MONTH' },
  },
  {
    id: "job-5",
    title: "מומחה/ית שיווק דיגיטלי",
    company: "באזז מדיה",
    region: "עבודה מהבית",
    jobType: "פרילנס",
    workModel: "מהבית",
    city: "מרחוק",
    description:
      "דרוש/ה מומחה/ית שיווק דיגיטלי לניהול קמפיינים בפלטפורמות השונות, אופטימיזציה ובניית אסטרטגיית תוכן עבור מותגים מובילים.",
    requirements: [
      "ניסיון בניהול קמפייני PPC",
      "היכרות עם Google Ads ו-Meta",
      "יכולת ניתוח נתונים",
      "יצירתיות ועצמאות",
    ],
    categoryIds: ["cat-marketing"],
    status: "active",
    allowSiteApply: true,
    allowWhatsApp: true,
    whatsappNumber: "972541112233",
    postedAt: "2026-06-12",
    salary: { type: 'minimum', min: 9500, period: 'MONTH' },
  },
  {
    id: "job-6",
    title: "רואה/ת חשבון",
    company: "פיננס פלוס",
    region: "ירושלים והסביבה",
    jobType: "משרה מלאה",
    workModel: "מהמשרד",
    city: "ירושלים",
    description:
      "משרד רואי חשבון מוביל מחפש רו\u05F4ח לתפקיד מגוון הכולל ביקורת, ייעוץ מס וליווי לקוחות עסקיים. אופק קידום ברור וסביבה מקצועית.",
    requirements: [
      "תעודת רואה חשבון מוסמך/ת",
      "ניסיון של שנתיים לפחות",
      "שליטה בתוכנות הנהלת חשבונות",
      "דייקנות ואחריות",
    ],
    categoryIds: ["cat-finance"],
    status: "draft",
    allowSiteApply: true,
    allowWhatsApp: false,
    whatsappNumber: "972541234567",
    postedAt: "2026-06-07",
  },
  {
    id: "job-7",
    title: "סטודנט/ית לתמיכה טכנית",
    company: "נובה טכנולוגיות",
    region: "דרום",
    jobType: "סטודנטים",
    workModel: "היברידי",
    city: "באר שבע",
    description:
      "הזדמנות מצוינת לסטודנטים/ות להשתלב בעולם ההייטק. תספקו תמיכה טכנית ללקוחות, תלמדו את המוצר לעומק ותהיו חלק מצוות תוסס.",
    requirements: [
      "סטודנט/ית למדעי המחשב או הנדסה",
      "ראש טכני וסקרנות",
      "זמינות ל-3 ימים בשבוע",
      "שירותיות גבוהה",
    ],
    categoryIds: ["cat-tech", "cat-service"],
    status: "active",
    allowSiteApply: true,
    allowWhatsApp: true,
    whatsappNumber: "972541234567",
    postedAt: "2026-06-13",
  },
]

export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: "app-1",
    jobId: "job-1",
    jobTitle: "מפתח/ת Full Stack בכיר/ה",
    name: "דניאל כהן",
    phone: "050-1234567",
    message: "שלום, אני מעוניין מאוד במשרה ובעל ניסיון רלוונטי של 5 שנים.",
    date: "2026-06-13",
  },
  {
    id: "app-2",
    jobId: "job-4",
    jobTitle: "מנהל/ת תיקי לקוחות",
    name: "מאיה לוי",
    phone: "052-7654321",
    message: "התפקיד נשמע מושלם עבורי, אשמח להתקדם בתהליך.",
    date: "2026-06-12",
  },
]

export function formatHebrewDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
