"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { UserPlus, Trash2, Pencil, Check, X, ShieldCheck, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ADMIN_PERMISSIONS,
  ADMIN_PERMISSION_LABELS,
  type AdminPermission,
  type PublicAdminStaff,
} from "@/lib/admin-staff"

function PermissionCheckboxes({
  value,
  onChange,
}: {
  value: AdminPermission[]
  onChange: (v: AdminPermission[]) => void
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {ADMIN_PERMISSIONS.map((perm) => (
        <label key={perm} className="flex items-center gap-1.5 cursor-pointer text-sm">
          <Checkbox
            checked={value.includes(perm)}
            onCheckedChange={(checked) => {
              onChange(
                checked ? [...value, perm] : value.filter((p) => p !== perm),
              )
            }}
          />
          {ADMIN_PERMISSION_LABELS[perm]}
        </label>
      ))}
    </div>
  )
}

function StaffForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: PublicAdminStaff
  onSave: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [email, setEmail] = useState(initial?.email ?? "")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [permissions, setPermissions] = useState<AdminPermission[]>(initial?.permissions ?? [])
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error("נא למלא שם ואימייל")
      return
    }
    if (!initial && !password) {
      toast.error("נא להגדיר סיסמה")
      return
    }
    setSaving(true)
    try {
      const body: Record<string, unknown> = { name, email, permissions }
      if (initial) {
        body.id = initial.id
        if (password) body.password = password
      } else {
        body.password = password
      }
      const res = await fetch("/api/admin/staff", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "שגיאה בשמירה")
        return
      }
      toast.success(initial ? "המשתמש עודכן" : "המשתמש נוצר")
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border p-5">
      <h3 className="font-semibold text-sm">
        {initial ? "עריכת משתמש" : "משתמש ניהול חדש"}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">שם מלא</label>
          <input
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ישראל ישראלי"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">אימייל</label>
          <input
            type="email"
            dir="ltr"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            {initial ? "סיסמה חדשה (השאר ריק לאי-שינוי)" : "סיסמה"}
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              dir="ltr"
              className="w-full rounded-lg border bg-background px-3 py-2 pe-9 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={initial ? "••••••••" : "לפחות 8 תווים"}
              minLength={initial ? undefined : 8}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute inset-y-0 end-2 flex items-center text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">הרשאות גישה</label>
        <PermissionCheckboxes value={permissions} onChange={setPermissions} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="size-3.5" />
          ביטול
        </Button>
        <Button type="submit" size="sm" disabled={saving}>
          <Check className="size-3.5" />
          {saving ? "שומר..." : "שמור"}
        </Button>
      </div>
    </form>
  )
}

function StaffRow({
  staff,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  staff: PublicAdminStaff
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 transition-opacity ${staff.active ? "" : "opacity-50"}`}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <ShieldCheck className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{staff.name}</p>
        <p className="text-xs text-muted-foreground" dir="ltr">{staff.email}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {staff.permissions.length === 0 ? (
            <span className="text-xs text-muted-foreground">אין הרשאות</span>
          ) : (
            staff.permissions.map((p) => (
              <span
                key={p}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                {ADMIN_PERMISSION_LABELS[p]}
              </span>
            ))
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          title={staff.active ? "השבת" : "הפעל"}
          onClick={onToggleActive}
        >
          {staff.active ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </Button>
        <Button variant="ghost" size="icon" className="size-8" title="עריכה" onClick={onEdit}>
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:text-destructive"
          title="מחיקה"
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function StaffTab() {
  const [staffList, setStaffList] = useState<PublicAdminStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<PublicAdminStaff | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/staff")
      if (res.ok) setStaffList(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`למחוק את "${name}"?`)) return
    const res = await fetch(`/api/admin/staff?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("המשתמש נמחק")
      load()
    } else {
      toast.error("שגיאה במחיקה")
    }
  }

  async function handleToggle(staff: PublicAdminStaff) {
    const res = await fetch("/api/admin/staff", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: staff.id, active: !staff.active }),
    })
    if (res.ok) {
      toast.success(staff.active ? "המשתמש הושבת" : "המשתמש הופעל")
      load()
    }
  }

  function openCreate() {
    setEditTarget(null)
    setShowForm(true)
  }

  function openEdit(s: PublicAdminStaff) {
    setEditTarget(s)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditTarget(null)
  }

  function afterSave() {
    closeForm()
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">משתמשי ניהול</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            צור משתמשים נוספים עם הרשאות מוגדרות
          </p>
        </div>
        <Button size="sm" onClick={openCreate} disabled={showForm}>
          <UserPlus className="size-3.5" />
          הוסף משתמש
        </Button>
      </div>

      {showForm && (
        <StaffForm initial={editTarget ?? undefined} onSave={afterSave} onCancel={closeForm} />
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">טוען...</p>
      ) : staffList.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          אין משתמשי ניהול. לחץ "הוסף משתמש" כדי להתחיל.
        </p>
      ) : (
        <div className="space-y-2">
          {staffList.map((s) => (
            <StaffRow
              key={s.id}
              staff={s}
              onEdit={() => openEdit(s)}
              onDelete={() => handleDelete(s.id, s.name)}
              onToggleActive={() => handleToggle(s)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
