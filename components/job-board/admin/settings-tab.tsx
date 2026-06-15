"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldContent } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { BellIcon, BuildingIcon, PhoneIcon, SaveIcon } from "lucide-react"
import type { GlobalSettings } from "@/lib/job-board-data"

type Props = {
  settings: GlobalSettings
  setSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>
}

export function SettingsTab({ settings, setSettings }: Props) {
  const [siteName, setSiteName] = useState("לוח הדרושים")
  const [contactPhone, setContactPhone] = useState("050-0000000")

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellIcon className="size-5 text-primary" />
            התראות והרשמות
          </CardTitle>
          <CardDescription>שליטה ביכולת המועמדים להירשם לעדכוני משרות חדשות</CardDescription>
        </CardHeader>
        <CardContent>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="alerts-toggle">הרשמה לעדכוני משרות</FieldLabel>
              <FieldDescription>
                כאשר מופעל, מוצג למועמדים טופס הרשמה לקבלת התראות על משרות חדשות.
              </FieldDescription>
            </FieldContent>
            <Switch
              id="alerts-toggle"
              checked={settings.jobAlertsEnabled}
              onCheckedChange={(checked) => {
                setSettings((prev) => ({ ...prev, jobAlertsEnabled: checked }))
                toast.success(checked ? "הרשמה לעדכונים הופעלה" : "הרשמה לעדכונים הושבתה")
              }}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BuildingIcon className="size-5 text-primary" />
            פרטי האתר
          </CardTitle>
          <CardDescription>מידע כללי המוצג ברחבי לוח הדרושים</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="site-name">שם האתר</FieldLabel>
              <Input id="site-name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
            </Field>
            <Separator />
            <Field>
              <FieldLabel htmlFor="contact-phone">טלפון ליצירת קשר</FieldLabel>
              <div className="relative">
                <PhoneIcon className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="contact-phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="pe-9"
                  dir="ltr"
                />
              </div>
            </Field>
            <Button
              className="w-fit"
              onClick={() => toast.success("הגדרות האתר נשמרו בהצלחה")}
            >
              <SaveIcon data-icon="inline-start" />
              שמירת הגדרות
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}
