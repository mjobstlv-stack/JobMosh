"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import { getCategoryIcon, ICON_REGISTRY } from "@/lib/category-icons"
import {
  ICON_OPTIONS,
  ICON_LABELS,
  type Category,
  type IconKey,
} from "@/lib/job-board-data"
import { Plus, Pencil, Trash2, Check, X } from "lucide-react"

export function CategoriesTab({
  categories,
  setCategories,
  jobs,
  setJobs,
}: {
  categories: Category[]
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>
  jobs: { id: string; categoryIds: string[] }[]
  setJobs: React.Dispatch<
    React.SetStateAction<import("@/lib/job-board-data").Job[]>
  >
}) {
  const [name, setName] = useState("")
  const [icon, setIcon] = useState<IconKey>("briefcase")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) {
      toast.error("נא להזין שם קטגוריה")
      return
    }
    setCategories((prev) => [
      ...prev,
      { id: `cat-${Date.now()}`, name: name.trim(), icon },
    ])
    toast.success("הקטגוריה נוספה בהצלחה")
    setName("")
    setIcon("briefcase")
  }

  function handleDelete(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id))
    // also clean up category references on jobs
    setJobs((prev) =>
      prev.map((j) => ({
        ...j,
        categoryIds: j.categoryIds.filter((c) => c !== id),
      })),
    )
    toast.success("הקטגוריה נמחקה")
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditName(cat.name)
  }

  function saveEdit(id: string) {
    if (editName.trim().length < 2) {
      toast.error("נא להזין שם תקין")
      return
    }
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: editName.trim() } : c)),
    )
    setEditingId(null)
    toast.success("הקטגוריה עודכנה")
  }

  function changeIcon(id: string, newIcon: IconKey) {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, icon: newIcon } : c)),
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>הוספת קטגוריה</CardTitle>
          <CardDescription>צרו תחום חדש שיוצג בעמוד הראשי</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="cat-name">שם הקטגוריה</FieldLabel>
                <Input
                  id="cat-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="לדוגמה: הייטק וטכנולוגיה"
                />
              </Field>
              <Field>
                <FieldLabel>אייקון</FieldLabel>
                <Select
                  value={icon}
                  onValueChange={(v) => setIcon(v as IconKey)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((key) => {
                      const Icon = ICON_REGISTRY[key]
                      return (
                        <SelectItem key={key} value={key}>
                          <Icon className="size-4" />
                          {ICON_LABELS[key]}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </Field>
              <Button type="submit" className="w-full">
                <Plus data-icon="inline-start" />
                הוספה
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>ניהול קטגוריות</CardTitle>
          <CardDescription>
            {categories.length} קטגוריות פעילות
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon)
              const isEditing = editingId === cat.id
              return (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-5" />
                  </span>

                  {isEditing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-9 flex-1"
                      autoFocus
                    />
                  ) : (
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {cat.name}
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <Select
                          value={cat.icon}
                          onValueChange={(v) =>
                            changeIcon(cat.id, v as IconKey)
                          }
                        >
                          <SelectTrigger size="sm" aria-label="שינוי אייקון">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS.map((key) => {
                              const I = ICON_REGISTRY[key]
                              return (
                                <SelectItem key={key} value={key}>
                                  <I className="size-4" />
                                  {ICON_LABELS[key]}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="שמירה"
                          onClick={() => saveEdit(cat.id)}
                        >
                          <Check />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="ביטול"
                          onClick={() => setEditingId(null)}
                        >
                          <X />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="עריכה"
                          onClick={() => startEdit(cat)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="מחיקה"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(cat.id)}
                        >
                          <Trash2 />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
