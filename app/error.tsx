"use client"

import { useEffect } from "react"
import { RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center"
    >
      <div className="max-w-sm">
        <div className="select-none text-[8rem] font-extrabold leading-none text-destructive/10">
          !</div>
        <h2 className="mt-4 text-xl font-bold text-foreground">
          משהו השתבש
        </h2>
        <p className="mt-2 text-muted-foreground">
          אירעה שגיאה בלתי צפויה. אנא נסו שוב.
          {error.digest && (
            <span className="mt-1 block text-xs text-muted-foreground/50">
              קוד שגיאה: {error.digest}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className="size-4" />
          נסה שוב
        </button>
      </div>
    </div>
  )
}
