"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import type { PublicUser } from "@/lib/user-types"

export function UsersTab() {
  const [users, setUsers] = useState<PublicUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/users", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5" />
          משתמשים רשומים
        </CardTitle>
        <CardDescription>
          {loading ? "טוען..." : `${users.length} משתמשים במערכת`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">טוען...</p>
        ) : users.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">אין משתמשים רשומים</p>
        ) : (
          <div className="space-y-3">
            {[...users]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{u.name || "ללא שם"}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    {u.phone && (
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {u.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge variant="outline">
                      {u.applications?.length ?? 0} הגשות
                    </Badge>
                    <span className="text-xs text-muted-foreground">{u.createdAt}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
