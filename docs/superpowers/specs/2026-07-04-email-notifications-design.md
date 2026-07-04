# Email Notifications on Application — Design Spec
Date: 2026-07-04

## Goal

When a candidate submits an application via the site form, send an email to a configured address with all form data and the CV file as an attachment. Each job can override the destination email address (for employers who want applications sent directly to them).

## Email Service

**Resend** — free tier (100 emails/day). API key stored in `RESEND_API_KEY` env var.

## Environment Variables

```
RESEND_API_KEY=re_xxxxx          # Resend API key
NOTIFICATION_EMAIL=you@gmail.com # Default recipient when job has no notificationEmail
```

## Data Model Change

Add one optional field to `Job` in `lib/job-board-data.ts`:

```typescript
notificationEmail?: string  // if set, overrides NOTIFICATION_EMAIL for this job
```

## API Route — `app/api/apply/route.ts`

- Method: `POST`, accepts `multipart/form-data`
- Fields: `name`, `phone`, `message`, `jobId`, `jobTitle`, `jobCompany`, `cv` (File, optional)
- Steps:
  1. Parse form data
  2. Determine recipient: `job.notificationEmail ?? process.env.NOTIFICATION_EMAIL`
  3. If CV file present: read as ArrayBuffer, convert to base64 for Resend attachment
  4. Send email via Resend
  5. Return `{ ok: true }` or `{ error: string }` with appropriate HTTP status

### Email format

**Subject:** `פנייה חדשה — {jobTitle} | {name}`

**Body (HTML):**
```
ג'וב מוש — פנייה חדשה

משרה:   {jobTitle} · {jobCompany}
מועמד:  {name}
טלפון:  {phone}
הודעה:  {message}

---
נשלח דרך jobmosh.co.il
```

**Attachment:** CV file with original filename (if uploaded). MIME type preserved from upload.

**From:** `ג'וב מוש <noreply@jobmosh.co.il>` — requires verified domain in Resend. Fallback during dev/testing: Resend's default sandbox sender.

## Form Change — `apply-form-dialog.tsx`

- File input: actually read the `File` object (currently only captures filename)
- On submit: build `FormData`, `fetch('/api/apply', { method: 'POST', body: formData })`
- On success (`ok: true`): existing success toast, close dialog, reset form
- On error: toast.error("שגיאה בשליחת המועמדות, נסה שנית")
- Pass `jobCompany` to the form (currently only `job.title` and `job.id` are used — `job.company` is available on the `Job` type)

## Admin UI Change — `job-form-dialog.tsx`

Add a new optional field in the job creation/edit form:

- Label: "מייל לקבלת פניות"
- Placeholder: "השאר ריק לשימוש במייל ברירת המחדל"
- Validates as email format if non-empty
- Maps to `notificationEmail` on the `Job` type

## File Size Limit

Max CV file size: **5MB**. Validate on the client (file input `onChange`) and on the server (check `file.size` before processing). Show error: "הקובץ גדול מדי — מקסימום 5MB".

## Package

Add `resend` npm package: `npm install resend`

## Out of Scope

- Persistent application storage (future — Supabase)
- Email templates with full HTML styling
- Confirmation email to the applicant
- Rate limiting
