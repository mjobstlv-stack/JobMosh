"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { BellRing, Mail, Send } from "lucide-react"

export function JobAlertsWidget() {
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!valid) {
      toast.error("נא להזין כתובת אימייל תקינה")
      return
    }
    if (!consent) {
      toast.error("יש לאשר קבלת התראות כדי להירשם")
      return
    }
    toast.success("נרשמתם בהצלחה!", {
      description: "נעדכן אתכם במשרות חדשות שמתאימות לכם.",
    })
    setEmail("")
    setConsent(false)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary p-6 text-primary-foreground shadow-md sm:p-8">
      {/* Decorative glow blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -start-10 h-48 w-48 rounded-full bg-primary-foreground/8 blur-2xl"
      />
      <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
            <BellRing className="size-6" />
          </span>
          <div>
            <h3 className="font-heading text-lg font-bold">
              לא לפספס אף משרה
            </h3>
            <p className="mt-1 text-sm text-primary-foreground/75">
              הירשמו והתראות על משרות חדשות יגיעו ישירות למייל שלכם
            </p>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto">
          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-2 sm:flex-row"
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
              className="h-11 shrink-0"
            >
              <Send data-icon="inline-start" />
              הרשמה
            </Button>
          </form>
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox
              checked={consent}
              onCheckedChange={(v) => setConsent(!!v)}
              className="mt-0.5 shrink-0 border-primary-foreground/40 data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary"
              id="alerts-consent"
            />
            <span className="text-[11px] leading-snug text-primary-foreground/60">
              אני מסכים/ה לקבל התראות על משרות חדשות בדוא"ל. ניתן לבטל בכל עת דרך{" "}
              <a href="mailto:info@jobmosh.co.il?subject=הסרה%20מרשימת%20התראות" className="underline hover:text-primary-foreground/90">
                פנייה אלינו
              </a>
              .
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}
