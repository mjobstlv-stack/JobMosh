"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MenuIcon, SaveIcon } from "lucide-react"
import type { GlobalSettings } from "@/lib/job-board-data"

type Props = {
  settings: GlobalSettings
  setSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>
}

export function NavTab({ settings, setSettings }: Props) {
  const [labels, setLabels] = useState({
    jobs: settings.navJobsLabel,
    companies: settings.navCompaniesLabel,
    careers: settings.navCareersLabel,
  })

  function toggleVisible(
    key: "navJobsVisible" | "navCompaniesVisible" | "navCareersVisible",
    value: boolean,
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }))
    toast.success(value ? "קישור הוצג" : "קישור הוסתר")
  }

  function saveLabels() {
    setSettings((prev) => ({
      ...prev,
      navJobsLabel: labels.jobs,
      navCompaniesLabel: labels.companies,
      navCareersLabel: labels.careers,
    }))
    toast.success("שמות הקישורים עודכנו")
  }

  const items: {
    visibleKey: "navJobsVisible" | "navCompaniesVisible" | "navCareersVisible"
    labelKey: "jobs" | "companies" | "careers"
    placeholder: string
    description: string
  }[] = [
    {
      visibleKey: "navJobsVisible",
      labelKey: "jobs",
      placeholder: "משרות",
      description: "גלילה לרשימת המשרות",
    },
    {
      visibleKey: "navCompaniesVisible",
      labelKey: "companies",
      placeholder: "חברות",
      description: "יופיע כשמדור החברות יהיה מוכן",
    },
    {
      visibleKey: "navCareersVisible",
      labelKey: "careers",
      placeholder: "ייעוץ קריירה",
      description: "יופיע כשמדור היועצים יהיה מוכן",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MenuIcon className="size-5 text-primary" />
          קישורי ניווט
        </CardTitle>
        <CardDescription>
          שליטה על הקישורים המופיעים בתפריט הראשי של האתר
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.visibleKey}
              className="flex items-center gap-4 rounded-lg border border-border p-3"
            >
              <Switch
                checked={settings[item.visibleKey]}
                onCheckedChange={(v) => toggleVisible(item.visibleKey, v)}
              />
              <div className="min-w-0 flex-1">
                <Input
                  value={labels[item.labelKey]}
                  onChange={(e) =>
                    setLabels((prev) => ({
                      ...prev,
                      [item.labelKey]: e.target.value,
                    }))
                  }
                  placeholder={item.placeholder}
                  className="h-8 text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
          <Button onClick={saveLabels} className="w-fit">
            <SaveIcon data-icon="inline-start" />
            שמירת שמות
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
