"use client"

import { cn } from "@/lib/utils"
import { getCategoryIcon } from "@/lib/category-icons"
import type { Category, Job } from "@/lib/job-board-data"
import { LayoutGrid } from "lucide-react"

export function CategoryGrid({
  categories,
  jobs,
  selectedId,
  onSelect,
}: {
  categories: Category[]
  jobs: Job[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const countFor = (catId: string) =>
    jobs.filter(
      (j) => j.status === "active" && j.categoryIds.includes(catId),
    ).length

  const activeTotal = jobs.filter((j) => j.status === "active").length

  return (
    <section aria-labelledby="categories-heading">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2
            id="categories-heading"
            className="font-heading text-xl font-bold text-foreground"
          >
            עיון לפי תחום
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            בחרו קטגוריה כדי לסנן את המשרות
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <CategoryCard
          label="כל המשרות"
          count={activeTotal}
          active={selectedId === null}
          onClick={() => onSelect(null)}
          icon={<LayoutGrid className="size-6" />}
        />
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.icon)
          return (
            <CategoryCard
              key={cat.id}
              label={cat.name}
              count={countFor(cat.id)}
              active={selectedId === cat.id}
              onClick={() => onSelect(cat.id)}
              icon={<Icon className="size-6" />}
            />
          )
        })}
      </div>
    </section>
  )
}

function CategoryCard({
  label,
  count,
  active,
  onClick,
  icon,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-col items-start gap-3 rounded-2xl border p-4 text-right transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-md"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:shadow-sm",
      )}
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-xl transition-colors",
          active ? "bg-primary-foreground/15" : "bg-accent text-accent-foreground",
        )}
      >
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-semibold leading-tight">{label}</span>
        <span
          className={cn(
            "mt-0.5 text-xs",
            active ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {count} משרות
        </span>
      </span>
    </button>
  )
}
