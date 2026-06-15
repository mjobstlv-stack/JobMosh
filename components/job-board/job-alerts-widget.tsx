"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { BellRing, Mail, Send } from "lucide-react"

export function JobAlertsWidget() {
  const [email, setEmail] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!valid) {
      toast.error("נא להזין כתובת אימייל תקינה")
      return
    }
    toast.success("נרשמתם בהצלחה!", {
      description: "נעדכן אתכם במשרות חדשות שמתאימות לכם.",
    })
    setEmail("")
  }

  return (
    <Card className="overflow-hidden border-primary/20 bg-primary p-6 text-primary-foreground sm:p-8">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
            <BellRing className="size-6" />
          </span>
          <div>
            <h3 className="font-heading text-lg font-bold">
              לא לפספס אף משרה
            </h3>
            <p className="mt-1 text-sm text-primary-foreground/80">
              הירשמו והתראות על משרות חדשות יגיעו ישירות למייל שלכם
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row"
        >
          <InputGroup className="w-full bg-background sm:w-64">
            <InputGroupInput
              type="email"
              dir="ltr"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="כתובת אימייל"
            />
            <InputGroupAddon>
              <Mail />
            </InputGroupAddon>
          </InputGroup>
          <Button
            type="submit"
            variant="secondary"
            className="shrink-0"
          >
            <Send data-icon="inline-start" />
            הרשמה
          </Button>
        </form>
      </div>
    </Card>
  )
}
