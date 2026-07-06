import type { UserProfile } from "@/lib/user-types"

export function ProfileSelector({
  profiles,
  selectedId,
  onSelect,
}: {
  profiles: UserProfile[]
  selectedId: string | null
  onSelect: (profile: UserProfile) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">בחר פרופיל לשליחה</p>
      {profiles.map(p => (
        <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
          selectedId === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
        }`}>
          <input type="radio" name="profile-select" value={p.id}
            checked={selectedId === p.id} onChange={() => onSelect(p)}
            className="accent-primary" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{p.title}</p>
            <p className="text-xs text-muted-foreground">
              {p.name} · {p.phone}{p.cvFileName ? ` · ${p.cvFileName}` : ""}
            </p>
          </div>
        </label>
      ))}
    </div>
  )
}
