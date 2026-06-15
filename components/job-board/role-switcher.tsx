"use client"

import { cn } from "@/lib/utils"
import { UserRound, ShieldCheck } from "lucide-react"

export type Role = "public" | "admin"

export function RoleSwitcher({
  role,
  onChange,
}: {
  role: Role
  onChange: (role: Role) => void
}) {
  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-border bg-popover/90 p-1 shadow-lg ring-1 ring-foreground/5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => onChange("public")}
          aria-pressed={role === "public"}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            role === "public"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <UserRound className="size-4" />
          ממשק מועמד
        </button>
        <button
          type="button"
          onClick={() => onChange("admin")}
          aria-pressed={role === "admin"}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            role === "admin"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ShieldCheck className="size-4" />
          ממשק מנהל
        </button>
      </div>
    </div>
  )
}
