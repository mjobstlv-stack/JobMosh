# Email Notifications on Application — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a candidate submits an application via the site form, send an email with all form data and the CV file attached to a configurable address.

**Architecture:** A new `POST /api/apply` route receives `multipart/form-data`, looks up the job's `notificationEmail` (or falls back to `NOTIFICATION_EMAIL` env var), and sends via Resend. The apply form is updated to POST to this route instead of storing in memory. Each job can have its own notification email set from the admin form.

**Tech Stack:** Next.js 16 App Router, Resend SDK (`resend` npm package), TypeScript 5.7

## Global Constraints

- All UI copy is Hebrew (RTL)
- No test framework — use `npx tsc --noEmit` as type verification
- Max CV file size: 5MB (validated client-side and server-side)
- Currency of email sender address: `RESEND_FROM` env var, default `onboarding@resend.dev` for dev/testing
- `notificationEmail` is optional on `Job` — jobs without it fall back to `NOTIFICATION_EMAIL` env var
- Resend free tier: 100 emails/day — sufficient for a small job board

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `lib/job-board-data.ts` | Modify | Add `notificationEmail?: string` to `Job` type |
| `.env.example` | Modify | Add `RESEND_API_KEY`, `RESEND_FROM`, `NOTIFICATION_EMAIL` |
| `app/api/apply/route.ts` | Create | Handle POST, send email via Resend |
| `components/job-board/apply-form-dialog.tsx` | Modify | Submit via fetch to API route, handle file properly |
| `components/job-board/admin/job-form-dialog.tsx` | Modify | Add notification email field |

---

### Task 1: Add `notificationEmail` to Job type and update env template

**Files:**
- Modify: `lib/job-board-data.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `notificationEmail?: string` on the `Job` type (used by Tasks 3 and 4)

- [ ] **Step 1: Add `notificationEmail` to the `Job` type**

  Open `lib/job-board-data.ts`. Find the `Job` type definition. After the `salary?: Salary` line (last field), add:

  ```typescript
  notificationEmail?: string
  ```

  The full updated end of the `Job` type should look like:

  ```typescript
  export type Job = {
    id: string
    title: string
    company: string
    region: Region
    jobType: JobType
    workModel: WorkModel
    city: string
    description: string
    requirements: string[]
    categoryIds: string[]
    status: JobStatus
    allowSiteApply: boolean
    allowWhatsApp: boolean
    whatsappNumber: string
    postedAt: string
    salary?: Salary
    notificationEmail?: string
  }
  ```

- [ ] **Step 2: Update `.env.example`**

  Open `.env.example` and add after the existing content:

  ```
  # ── Email notifications (Resend) ─────────────────────────────────────────────
  # Get your API key at https://resend.com
  RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
  # Default recipient for application notifications
  NOTIFICATION_EMAIL=you@gmail.com
  # Sender address — must be a verified domain in Resend.
  # Use the default below for testing; update once jobmosh.co.il is verified.
  RESEND_FROM=ג'וב מוש <onboarding@resend.dev>
  ```

- [ ] **Step 3: Type-check**

  ```
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 4: Commit**

  ```bash
  git add lib/job-board-data.ts .env.example
  git commit -m "feat: add notificationEmail to Job type and env template"
  ```

---

### Task 2: Install Resend and create the API route

**Files:**
- Create: `app/api/apply/route.ts`

**Interfaces:**
- Consumes:
  - `job.notificationEmail?: string` from `Job` type (Task 1)
  - `RESEND_API_KEY`, `NOTIFICATION_EMAIL`, `RESEND_FROM` env vars
- Produces:
  - `POST /api/apply` — accepts `multipart/form-data`, returns `{ ok: true }` or `{ error: string }`

- [ ] **Step 1: Install Resend**

  ```bash
  npm install resend
  ```

  Expected: `resend` appears in `package.json` dependencies.

- [ ] **Step 2: Create `app/api/apply/route.ts`**

  Create the file with the following content:

  ```typescript
  import { NextRequest, NextResponse } from "next/server"
  import { Resend } from "resend"

  const resend = new Resend(process.env.RESEND_API_KEY)
  const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5MB

  export async function POST(req: NextRequest) {
    try {
      const form = await req.formData()

      const name = (form.get("name") as string | null)?.trim() ?? ""
      const phone = (form.get("phone") as string | null)?.trim() ?? ""
      const message = (form.get("message") as string | null)?.trim() ?? ""
      const jobId = (form.get("jobId") as string | null) ?? ""
      const jobTitle = (form.get("jobTitle") as string | null) ?? ""
      const jobCompany = (form.get("jobCompany") as string | null) ?? ""
      const notificationEmail = (form.get("notificationEmail") as string | null)?.trim() || null
      const cvFile = form.get("cv") as File | null

      if (!name || !phone || !jobId) {
        return NextResponse.json({ error: "חסרים שדות חובה" }, { status: 400 })
      }

      if (cvFile && cvFile.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: "הקובץ גדול מדי — מקסימום 5MB" }, { status: 400 })
      }

      const recipient = notificationEmail ?? process.env.NOTIFICATION_EMAIL

      if (!recipient) {
        return NextResponse.json({ error: "לא הוגדר מייל יעד" }, { status: 500 })
      }

      const from = process.env.RESEND_FROM ?? "onboarding@resend.dev"
      const subject = `פנייה חדשה — ${jobTitle} | ${name}`

      const html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #163300;">ג'וב מוש — פנייה חדשה</h2>
          <table style="width:100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #666;">משרה</td><td style="padding: 6px 0;"><strong>${jobTitle}</strong> · ${jobCompany}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">מועמד</td><td style="padding: 6px 0;">${name}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">טלפון</td><td style="padding: 6px 0;" dir="ltr">${phone}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">הודעה</td><td style="padding: 6px 0;">${message || "—"}</td></tr>
          </table>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #999; font-size: 12px;">נשלח דרך <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobmosh.co.il"}">jobmosh.co.il</a></p>
        </div>
      `

      const attachments: { filename: string; content: string }[] = []

      if (cvFile && cvFile.size > 0) {
        const buffer = await cvFile.arrayBuffer()
        const base64 = Buffer.from(buffer).toString("base64")
        attachments.push({ filename: cvFile.name, content: base64 })
      }

      await resend.emails.send({
        from,
        to: [recipient],
        subject,
        html,
        attachments,
      })

      return NextResponse.json({ ok: true })
    } catch (err) {
      console.error("[apply] email send error:", err)
      return NextResponse.json({ error: "שגיאה בשליחת המייל" }, { status: 500 })
    }
  }
  ```

- [ ] **Step 3: Type-check**

  ```
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 4: Commit**

  ```bash
  git add app/api/apply/route.ts package.json package-lock.json
  git commit -m "feat: add /api/apply route — sends email via Resend on application"
  ```

---

### Task 3: Update apply form to POST to API route

**Files:**
- Modify: `components/job-board/apply-form-dialog.tsx`

**Interfaces:**
- Consumes: `POST /api/apply` from Task 2
- The `onSubmitApplication` prop is still called on success (to keep the admin panel's in-session list working)

- [ ] **Step 1: Store the actual File object in state**

  Open `components/job-board/apply-form-dialog.tsx`.

  Change the `fileName` state (currently `string | null`) to store the full `File`:

  ```typescript
  const [cvFile, setCvFile] = useState<File | null>(null)
  ```

  Update the `reset` function:

  ```typescript
  function reset() {
    setName("")
    setPhone("")
    setMessage("")
    setCvFile(null)
    setConsent(false)
    setErrors({})
  }
  ```

  Update the file input `onChange`:

  ```tsx
  onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
  ```

  Update the display label to use `cvFile?.name`:

  ```tsx
  <span className="truncate text-foreground">
    {cvFile ? cvFile.name : "בחרו קובץ PDF או Word להעלאה"}
  </span>
  ```

  Add client-side file size validation in the `validate` function. Add this after the consent check:

  ```typescript
  if (cvFile && cvFile.size > 5 * 1024 * 1024) {
    toast.error("הקובץ גדול מדי — מקסימום 5MB")
    return false
  }
  ```

- [ ] **Step 2: Change `handleSubmit` to POST to the API**

  Replace the current `handleSubmit` body (after `if (!validate()) return`) with:

  ```typescript
  const formData = new FormData()
  formData.append("name", name.trim())
  formData.append("phone", phone.trim())
  formData.append("message", message.trim())
  formData.append("jobId", job.id)
  formData.append("jobTitle", job.title)
  formData.append("jobCompany", job.company)
  if (job.notificationEmail) formData.append("notificationEmail", job.notificationEmail)
  if (cvFile) formData.append("cv", cvFile)

  try {
    const res = await fetch("/api/apply", { method: "POST", body: formData })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? "שגיאה בשליחת המועמדות, נסה שנית")
      return
    }

    onSubmitApplication({
      id: `app-${Date.now()}`,
      jobId: job.id,
      jobTitle: job.title,
      name: name.trim(),
      phone: phone.trim(),
      message: message.trim(),
      date: new Date().toISOString().slice(0, 10),
    })

    toast.success("המועמדות נשלחה בהצלחה!", {
      description: `הפנייה שלך למשרת "${job.title}" התקבלה. נחזור אליך בהקדם.`,
    })
    reset()
    onOpenChange(false)
  } catch {
    toast.error("שגיאה בשליחת המועמדות, נסה שנית")
  }
  ```

  Since `handleSubmit` is now async, update the function signature:

  ```typescript
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    // ... rest of body above
  }
  ```

- [ ] **Step 3: Type-check**

  ```
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 4: Commit**

  ```bash
  git add components/job-board/apply-form-dialog.tsx
  git commit -m "feat: apply form submits to /api/apply with CV file"
  ```

---

### Task 4: Add notification email field in admin job form

**Files:**
- Modify: `components/job-board/admin/job-form-dialog.tsx`

**Interfaces:**
- Consumes: `notificationEmail?: string` on `Job` type (Task 1)

- [ ] **Step 1: Add `notificationEmail` to `EMPTY` draft**

  Open `components/job-board/admin/job-form-dialog.tsx`.

  In the `EMPTY` constant, add after `whatsappNumber`:

  ```typescript
  notificationEmail: "",
  ```

  The full updated `EMPTY` constant:

  ```typescript
  const EMPTY: Draft = {
    title: "",
    company: "",
    region: "מרכז",
    jobType: "משרה מלאה",
    workModel: "מהמשרד",
    city: "",
    description: "",
    requirements: [],
    categoryIds: [],
    status: "active",
    allowSiteApply: true,
    allowWhatsApp: true,
    whatsappNumber: "972541234567",
    notificationEmail: "",
  }
  ```

- [ ] **Step 2: Add `notificationEmail` to the saved job in `handleSubmit`**

  In `handleSubmit`, find the `saved` object construction. Add after `whatsappNumber`:

  ```typescript
  notificationEmail: draft.notificationEmail?.trim() || undefined,
  ```

  So the `saved` object ends with:

  ```typescript
  const saved: Job = {
    id: draft.id ?? `job-${Date.now()}`,
    postedAt: draft.postedAt ?? new Date().toISOString().slice(0, 10),
    title: draft.title.trim(),
    company: draft.company.trim(),
    region: draft.region,
    jobType: draft.jobType,
    workModel: draft.workModel,
    city: draft.city.trim(),
    description: draft.description.trim(),
    requirements,
    categoryIds: draft.categoryIds,
    status: draft.status,
    allowSiteApply: draft.allowSiteApply,
    allowWhatsApp: draft.allowWhatsApp,
    whatsappNumber: draft.whatsappNumber,
    salary: draft.salary,
    notificationEmail: draft.notificationEmail?.trim() || undefined,
  }
  ```

- [ ] **Step 3: Add the email field to the form UI**

  Add this import at the top (add `Mail` to the lucide-react import):

  ```typescript
  import { Send, MessageCircle, Mail } from "lucide-react"
  ```

  Also add `FieldDescription` to the `@/components/ui/field` import:

  ```typescript
  import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldError,
    FieldSet,
    FieldLegend,
    FieldDescription,
  } from "@/components/ui/field"
  ```

  In the form, inside the `FieldSet` for "ניהול ערוצי הגשה", after the WhatsApp number `Field` block (and before the closing `</div>` of the bordered container), add:

  ```tsx
  {draft.allowSiteApply && (
    <Field>
      <FieldLabel htmlFor="job-email">
        <Mail className="inline size-4 text-primary ml-1" />
        מייל לקבלת פניות מהאתר
      </FieldLabel>
      <Input
        id="job-email"
        type="email"
        dir="ltr"
        value={draft.notificationEmail ?? ""}
        onChange={(e) => set("notificationEmail", e.target.value)}
        placeholder="employer@company.com"
        className="text-right"
      />
      <FieldDescription>
        השאר ריק לשימוש במייל ברירת המחדל של המערכת
      </FieldDescription>
    </Field>
  )}
  ```

- [ ] **Step 4: Type-check**

  ```
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 5: Commit**

  ```bash
  git add components/job-board/admin/job-form-dialog.tsx
  git commit -m "feat: add per-job notification email field in admin form"
  ```

---

### Task 5: Add env vars to Vercel + smoke test

**Files:** No code changes — configuration only.

- [ ] **Step 1: Add env vars in Vercel dashboard**

  Go to Vercel → Project → Settings → Environment Variables. Add:

  | Key | Value |
  |-----|-------|
  | `RESEND_API_KEY` | Your Resend API key (from resend.com) |
  | `NOTIFICATION_EMAIL` | The email address to receive applications |
  | `RESEND_FROM` | `onboarding@resend.dev` (until jobmosh.co.il is verified in Resend) |

  Set all three to **Production and Preview** environments.

- [ ] **Step 2: Also add to local `.env.local`**

  Open `C:\Users\yes\Downloads\JobMosh\.env.local` and add:

  ```
  RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
  NOTIFICATION_EMAIL=mjobstlv@gmail.com
  RESEND_FROM=onboarding@resend.dev
  ```

- [ ] **Step 3: Push all commits and wait for Vercel deploy**

  ```bash
  git push origin main
  ```

  Wait for Vercel to finish deploying (~2 minutes).

- [ ] **Step 4: Smoke test on production**

  1. Open the live site
  2. Click on any active job
  3. Click "הגש מועמדות באתר"
  4. Fill in name, phone, upload a small PDF
  5. Submit
  6. Verify toast shows "המועמדות נשלחה בהצלחה!"
  7. Check `mjobstlv@gmail.com` inbox — email should arrive within 30 seconds

  **If no email arrives:**
  - Check Vercel function logs (Vercel → Deployments → Functions tab) for `[apply] email send error`
  - Verify `RESEND_API_KEY` is set correctly in Vercel env vars
  - Check Resend dashboard → Emails for delivery status
