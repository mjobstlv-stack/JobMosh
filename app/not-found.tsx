import Link from "next/link"
import { Home } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "הדף לא נמצא",
}

export default function NotFound() {
  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center"
    >
      <div className="max-w-sm">
        <div className="select-none text-[8rem] font-extrabold leading-none text-primary/10">
          404
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          הדף לא נמצא
        </h1>
        <p className="mt-2 text-muted-foreground">
          הדף שחיפשתם אינו קיים או הועבר למקום אחר.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Home className="size-4" />
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  )
}
