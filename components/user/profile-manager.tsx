"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ProfileForm } from "./profile-form"
import type { PublicUser, UserProfile } from "@/lib/user-types"

export function ProfileManager({
  user,
  onUpdate,
}: {
  user: PublicUser
  onUpdate: (u: PublicUser) => void
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<UserProfile | null>(null)

  async function saveProfiles(profiles: UserProfile[]) {
    const res = await fetch("/api/user/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profiles }),
    })
    if (!res.ok) { toast.error("שגיאה בשמירה"); return }
    onUpdate(await res.json())
  }

  async function handleSave(profile: UserProfile) {
    const updated = editing
      ? user.profiles.map(p => p.id === profile.id ? profile : p)
      : [...user.profiles, profile]
    await saveProfiles(updated)
    setFormOpen(false)
    toast.success(editing ? "הפרופיל עודכן" : "הפרופיל נוסף")
  }

  async function handleDelete(id: string) {
    const profile = user.profiles.find(p => p.id === id)
    if (profile?.cvPath) {
      const cvRes = await fetch("/api/user/cv", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: id }),
      })
      if (!cvRes.ok) {
        toast.error("שגיאה במחיקת קורות חיים")
        return
      }
    }
    await saveProfiles(user.profiles.filter(p => p.id !== id))
    toast.success("הפרופיל נמחק")
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>הפרופילים שלי</CardTitle>
          <CardDescription>כל פרופיל מכיל שם, טלפון וקורות חיים לתפקיד שונה</CardDescription>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
          <Plus data-icon="inline-start" />הוסף פרופיל
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {user.profiles.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">אין פרופילים עדיין — הוסף את הראשון</p>
        ) : user.profiles.map(p => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border border-border p-4">
            <div className="min-w-0">
              <p className="font-medium text-foreground">{p.title}</p>
              <p className="text-sm text-muted-foreground">{p.name} · {p.phone}</p>
              {p.cvFileName && <p className="mt-0.5 text-xs text-primary">{p.cvFileName}</p>}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="icon-sm" aria-label="ערוך פרופיל"
                onClick={() => { setEditing(p); setFormOpen(true) }}><Pencil /></Button>
              <Button variant="ghost" size="icon-sm" aria-label="מחק פרופיל"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(p.id)}><Trash2 /></Button>
            </div>
          </div>
        ))}
      </CardContent>
      <ProfileForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSave={handleSave}
      />
    </Card>
  )
}
