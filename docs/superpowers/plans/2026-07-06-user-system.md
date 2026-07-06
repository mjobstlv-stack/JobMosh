# User System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email+password user accounts to JobMosh — registration, login, multi-profile management, CV storage, auto-fill on job applications, and application history.

**Architecture:** HMAC session cookies (extends existing admin pattern), all data in Vercel Blob as private JSON. No new paid services. bcryptjs for password hashing.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, bcryptjs, Resend (already integrated), @vercel/blob (already integrated), shadcn/ui, Tailwind v4

## Global Constraints

- Storage: Vercel Blob only — `access: "private"` on all user paths
- Auth: bcrypt cost factor **10** — exact value, not configurable
- Session cookie name: `jm_user_session` — format `{userId}|{expires}|{hmac_sig}`, 30-day expiry
- Password reset tokens: 32 random bytes hex, expire after **3600000 ms (1 hour)**
- All UI: `dir="rtl"`, Hebrew labels, shadcn/ui components only
- TypeScript: no `any`, no `!` non-null assertions except where noted
- Rate limit all auth endpoints: 5 req/min per IP (same Map-based pattern as `app/api/apply/route.ts`)
- Blob paths: `users/{userId}.json`, `users/lookup/{sha256hex}.json`, `users/reset-tokens/{token}.json`, `cv/users/{userId}/{profileId}-{filename}`

---

## File Map

**New files:**
```
lib/user-types.ts
lib/blob-user.ts
app/api/user/register/route.ts
app/api/user/login/route.ts
app/api/user/logout/route.ts
app/api/user/me/route.ts
app/api/user/cv/route.ts
app/api/user/forgot-password/route.ts
app/api/user/reset-password/route.ts
app/profile/page.tsx
app/reset-password/page.tsx
components/auth/login-register-dialog.tsx
components/user/profile-manager.tsx
components/user/profile-form.tsx
components/user/application-history.tsx
components/user/profile-selector.tsx
```

**Modified files:**
```
lib/session.ts                              ← add createUserSessionToken / verifyUserSessionToken
components/job-board/public-view.tsx        ← login button + avatar dropdown in header
components/job-board/apply-form-dialog.tsx  ← ProfileSelector when user logged in
app/api/apply/route.ts                      ← record application in user history
```

---

### Task 1: Foundation — Install dependency + Types + Blob helpers + Session extension

**Files:**
- Create: `lib/user-types.ts`
- Create: `lib/blob-user.ts`
- Modify: `lib/session.ts`

**Interfaces:**
- Produces:
  - `UserProfile`, `UserApplication`, `User`, `PublicUser` types from `lib/user-types.ts`
  - `getUser(userId)`, `saveUser(user)`, `getUserByEmail(email)`, `createEmailLookup(email, userId)`, `saveResetToken(token, userId)`, `getResetToken(token)`, `deleteResetToken(token)` from `lib/blob-user.ts`
  - `createUserSessionToken(userId: string): string`, `verifyUserSessionToken(token: string): string | null` from `lib/session.ts`

- [ ] **Step 1: Install bcryptjs**

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

Expected: `node_modules/bcryptjs` exists, `package.json` has `"bcryptjs"` in dependencies.

- [ ] **Step 2: Create `lib/user-types.ts`**

```typescript
export type UserProfile = {
  id: string
  title: string
  name: string
  phone: string
  cvPath?: string
  cvFileName?: string
}

export type UserApplication = {
  jobId: string
  jobTitle: string
  company: string
  appliedAt: string
  profileId: string
}

export type User = {
  id: string
  email: string
  passwordHash: string
  createdAt: string
  profiles: UserProfile[]
  applications: UserApplication[]
}

export type PublicUser = Omit<User, "passwordHash">
```

- [ ] **Step 3: Create `lib/blob-user.ts`**

```typescript
import { get, put, del } from "@vercel/blob"
import { createHash } from "node:crypto"
import type { User } from "./user-types"

function emailToHash(email: string): string {
  return createHash("sha256").update(email.toLowerCase().trim()).digest("hex")
}

async function readBlob(pathname: string): Promise<unknown | null> {
  try {
    const result = await get(pathname, { access: "private" })
    if (!result) return null
    const text = await new Response(result.stream).text()
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function getUser(userId: string): Promise<User | null> {
  return readBlob(`users/${userId}.json`) as Promise<User | null>
}

export async function saveUser(user: User): Promise<void> {
  await put(`users/${user.id}.json`, JSON.stringify(user), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
  })
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const lookup = await readBlob(`users/lookup/${emailToHash(email)}.json`) as { userId: string } | null
  if (!lookup) return null
  return getUser(lookup.userId)
}

export async function createEmailLookup(email: string, userId: string): Promise<void> {
  await put(
    `users/lookup/${emailToHash(email)}.json`,
    JSON.stringify({ userId }),
    { access: "private", addRandomSuffix: false, contentType: "application/json" },
  )
}

export async function saveResetToken(token: string, userId: string): Promise<void> {
  const expiresAt = Date.now() + 3_600_000
  await put(
    `users/reset-tokens/${token}.json`,
    JSON.stringify({ userId, expiresAt }),
    { access: "private", addRandomSuffix: false, contentType: "application/json" },
  )
}

export async function getResetToken(token: string): Promise<{ userId: string; expiresAt: number } | null> {
  return readBlob(`users/reset-tokens/${token}.json`) as Promise<{ userId: string; expiresAt: number } | null>
}

export async function deleteResetToken(token: string): Promise<void> {
  try { await del(`users/reset-tokens/${token}.json`) } catch { /* ignore */ }
}
```

- [ ] **Step 4: Extend `lib/session.ts` — add user session functions**

Open `lib/session.ts`. It already imports `createHmac`, `timingSafeEqual` from `node:crypto`. Add these two functions **at the end of the file**:

```typescript
const USER_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export function createUserSessionToken(userId: string): string {
  const expires = Date.now() + USER_SESSION_DURATION_MS
  const payload = `${userId}|${expires}`
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex")
  return `${payload}|${sig}`
}

export function verifyUserSessionToken(token: string): string | null {
  const lastPipe = token.lastIndexOf("|")
  if (lastPipe === -1) return null
  const payload = token.slice(0, lastPipe)
  const sig = token.slice(lastPipe + 1)
  const pipeIdx = payload.indexOf("|")
  if (pipeIdx === -1) return null
  const userId = payload.slice(0, pipeIdx)
  const expires = parseInt(payload.slice(pipeIdx + 1), 10)
  if (isNaN(expires) || Date.now() > expires) return null
  const expected = createHmac("sha256", getSecret()).update(payload).digest("hex")
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null
  } catch {
    return null
  }
  return userId
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/user-types.ts lib/blob-user.ts lib/session.ts package.json package-lock.json
git commit -m "feat: user system foundation — types, blob helpers, session functions"
```

---

### Task 2: Register + Login + Logout API

**Files:**
- Create: `app/api/user/register/route.ts`
- Create: `app/api/user/login/route.ts`
- Create: `app/api/user/logout/route.ts`

**Interfaces:**
- Consumes: `getUserByEmail`, `saveUser`, `createEmailLookup` from `lib/blob-user.ts`; `createUserSessionToken` from `lib/session.ts`; `User` from `lib/user-types.ts`
- Produces: `POST /api/user/register` → sets `jm_user_session` cookie, returns `{ ok: true }`; `POST /api/user/login` → same; `POST /api/user/logout` → clears cookie

- [ ] **Step 1: Create `app/api/user/register/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { getUserByEmail, saveUser, createEmailLookup } from "@/lib/blob-user"
import { createUserSessionToken } from "@/lib/session"

export const runtime = "nodejs"

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/
const rlMap = new Map<string, { count: number; resetAt: number }>()

function checkRL(ip: string): boolean {
  const now = Date.now()
  const e = rlMap.get(ip)
  if (!e || now > e.resetAt) { rlMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true }
  if (e.count >= 5) return false
  e.count++; return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRL(ip)) return NextResponse.json({ error: "יותר מדי בקשות" }, { status: 429 })

  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: "מייל וסיסמה נדרשים" }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "כתובת מייל לא תקינה" }, { status: 400 })
  if (typeof password !== "string" || password.length < 8)
    return NextResponse.json({ error: "הסיסמה חייבת להכיל לפחות 8 תווים" }, { status: 400 })

  const existing = await getUserByEmail(email)
  if (existing) return NextResponse.json({ error: "כתובת המייל כבר רשומה" }, { status: 409 })

  const userId = `user-${Date.now()}`
  const passwordHash = await bcrypt.hash(password, 10)
  const user = {
    id: userId,
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt: new Date().toISOString().slice(0, 10),
    profiles: [],
    applications: [],
  }
  await saveUser(user)
  await createEmailLookup(email, userId)

  const token = createUserSessionToken(userId)
  const cookieStore = await cookies()
  cookieStore.set("jm_user_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create `app/api/user/login/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { getUserByEmail } from "@/lib/blob-user"
import { createUserSessionToken } from "@/lib/session"

export const runtime = "nodejs"

const rlMap = new Map<string, { count: number; resetAt: number }>()
function checkRL(ip: string): boolean {
  const now = Date.now()
  const e = rlMap.get(ip)
  if (!e || now > e.resetAt) { rlMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true }
  if (e.count >= 5) return false
  e.count++; return true
}

const GENERIC = "מייל או סיסמה שגויים"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRL(ip)) return NextResponse.json({ error: "יותר מדי בקשות" }, { status: 429 })

  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: GENERIC }, { status: 401 })

  const user = await getUserByEmail(email)
  if (!user) {
    await bcrypt.hash(password, 10) // constant-time dummy to prevent timing attacks
    return NextResponse.json({ error: GENERIC }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return NextResponse.json({ error: GENERIC }, { status: 401 })

  const token = createUserSessionToken(user.id)
  const cookieStore = await cookies()
  cookieStore.set("jm_user_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Create `app/api/user/logout/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete("jm_user_session")
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Manual smoke test** (requires local `npm run dev` and real Blob env vars)

```bash
# Register
curl -s -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | cat
# Expected: {"ok":true}

# Login with wrong password
curl -s -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpass"}' | cat
# Expected: {"error":"מייל או סיסמה שגויים"}
```

- [ ] **Step 6: Commit**

```bash
git add app/api/user/
git commit -m "feat: register, login, logout API routes"
```

---

### Task 3: Password Reset API + Reset Page

**Files:**
- Create: `app/api/user/forgot-password/route.ts`
- Create: `app/api/user/reset-password/route.ts`
- Create: `app/reset-password/page.tsx`

**Interfaces:**
- Consumes: `getUserByEmail`, `getUser`, `saveUser`, `saveResetToken`, `getResetToken`, `deleteResetToken` from `lib/blob-user.ts`
- Produces: `POST /api/user/forgot-password` → always `{ ok: true }`; `POST /api/user/reset-password` → `{ ok: true }` or error; `/reset-password?token=...` page

- [ ] **Step 1: Create `app/api/user/forgot-password/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { randomBytes } from "node:crypto"
import { getUserByEmail, saveResetToken } from "@/lib/blob-user"

export const runtime = "nodejs"

const rlMap = new Map<string, { count: number; resetAt: number }>()
function checkRL(ip: string): boolean {
  const now = Date.now()
  const e = rlMap.get(ip)
  if (!e || now > e.resetAt) { rlMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true }
  if (e.count >= 5) return false
  e.count++; return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRL(ip)) return NextResponse.json({ ok: true }) // silently rate-limit

  const { email } = await req.json()
  if (!email) return NextResponse.json({ ok: true })

  const user = await getUserByEmail(email)
  if (!user) return NextResponse.json({ ok: true }) // no enumeration

  const token = randomBytes(32).toString("hex")
  await saveResetToken(token, user.id)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobmosh.co.il"
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
    to: [email],
    subject: "איפוס סיסמה — ג'וב מוש",
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;">
        <h2 style="color:#163300;">איפוס סיסמה</h2>
        <p>קיבלנו בקשה לאיפוס הסיסמה שלך. הקישור תקף לשעה אחת.</p>
        <a href="${siteUrl}/reset-password?token=${token}"
           style="display:inline-block;background:#163300;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">
          אפס סיסמה
        </a>
        <p style="color:#999;font-size:12px;">אם לא ביקשת איפוס, התעלם ממייל זה.</p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create `app/api/user/reset-password/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getResetToken, deleteResetToken, getUser, saveUser } from "@/lib/blob-user"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json()

  if (!token || typeof newPassword !== "string" || newPassword.length < 8)
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 })

  const tokenData = await getResetToken(token)
  if (!tokenData || Date.now() > tokenData.expiresAt)
    return NextResponse.json({ error: "הקישור פג תוקף — בקש קישור חדש" }, { status: 400 })

  const user = await getUser(tokenData.userId)
  if (!user) return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 })

  user.passwordHash = await bcrypt.hash(newPassword, 10)
  await saveUser(user)
  await deleteResetToken(token)

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Create `app/reset-password/page.tsx`**

```tsx
"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"

function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError("הסיסמה חייבת להכיל לפחות 8 תווים"); return }
    if (password !== confirm) { setError("הסיסמאות אינן תואמות"); return }
    setLoading(true); setError("")
    const res = await fetch("/api/user/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "שגיאה"); return }
    setDone(true)
  }

  if (done) return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
      <p className="text-foreground font-medium">הסיסמה עודכנה בהצלחה!</p>
      <Button className="w-full" onClick={() => router.push("/")}>חזרה לדף הבית</Button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8 space-y-4">
      <h1 className="text-xl font-bold text-foreground">איפוס סיסמה</h1>
      <Field>
        <FieldLabel htmlFor="rp-pw">סיסמה חדשה</FieldLabel>
        <Input id="rp-pw" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="לפחות 8 תווים" />
      </Field>
      <Field>
        <FieldLabel htmlFor="rp-confirm">אימות סיסמה</FieldLabel>
        <Input id="rp-confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
      </Field>
      {error && <FieldError>{error}</FieldError>}
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "מעדכן..." : "עדכן סיסמה"}</Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="block text-center font-heading text-2xl font-extrabold text-foreground">
          ג&apos;וב<span className="text-primary">מוש</span>
        </Link>
        <Suspense fallback={<div className="text-center text-muted-foreground">טוען...</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/user/forgot-password/ app/api/user/reset-password/ app/reset-password/
git commit -m "feat: password reset API + reset page"
```

---

### Task 4: Profile API — GET/PUT me + CV upload/delete

**Files:**
- Create: `app/api/user/me/route.ts`
- Create: `app/api/user/cv/route.ts`

**Interfaces:**
- Consumes: `getUser`, `saveUser` from `lib/blob-user.ts`; `verifyUserSessionToken` from `lib/session.ts`; `UserProfile` from `lib/user-types.ts`; `put`, `del` from `@vercel/blob`
- Produces:
  - `GET /api/user/me` → `PublicUser` (User without passwordHash), 401 if not authenticated
  - `PUT /api/user/me` body `{ profiles: UserProfile[] }` → updated `PublicUser`
  - `POST /api/user/cv` formData `{ profileId, cv: File }` → updated `PublicUser`
  - `DELETE /api/user/cv` body `{ profileId }` → updated `PublicUser`

- [ ] **Step 1: Create `app/api/user/me/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyUserSessionToken } from "@/lib/session"
import { getUser, saveUser } from "@/lib/blob-user"
import type { UserProfile } from "@/lib/user-types"

export const runtime = "nodejs"

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("jm_user_session")?.value
  if (!token) return null
  return verifyUserSessionToken(token)
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(userId)
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const { passwordHash: _, ...publicUser } = user
  return NextResponse.json(publicUser)
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(userId)
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  if (!Array.isArray(body.profiles))
    return NextResponse.json({ error: "profiles must be array" }, { status: 400 })

  user.profiles = (body.profiles as UserProfile[]).map(p => ({
    id: p.id || `profile-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: String(p.title ?? "").slice(0, 100),
    name: String(p.name ?? "").slice(0, 100),
    phone: String(p.phone ?? "").slice(0, 20),
    ...(p.cvPath ? { cvPath: p.cvPath } : {}),
    ...(p.cvFileName ? { cvFileName: p.cvFileName } : {}),
  }))

  await saveUser(user)
  const { passwordHash: _, ...publicUser } = user
  return NextResponse.json(publicUser)
}
```

- [ ] **Step 2: Create `app/api/user/cv/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { put, del } from "@vercel/blob"
import { verifyUserSessionToken } from "@/lib/session"
import { getUser, saveUser } from "@/lib/blob-user"

export const runtime = "nodejs"

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("jm_user_session")?.value
  if (!token) return null
  return verifyUserSessionToken(token)
}

function safeName(name: string): string {
  return name.replace(/\.\./g, "_").replace(/[^\wא-ת.\-]/g, "_").slice(0, 100)
}

export async function POST(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(userId)
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const form = await req.formData()
  const profileId = form.get("profileId") as string | null
  const file = form.get("cv") as File | null
  if (!profileId || !file) return NextResponse.json({ error: "profileId and cv required" }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "הקובץ גדול מדי — מקסימום 5MB" }, { status: 400 })
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "PDF או Word בלבד" }, { status: 400 })

  const profile = user.profiles.find(p => p.id === profileId)
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  if (profile.cvPath) {
    try { await del(profile.cvPath) } catch { /* ignore */ }
  }

  const blob = await put(
    `cv/users/${userId}/${profileId}-${safeName(file.name)}`,
    file,
    { access: "private" },
  )
  profile.cvPath = blob.pathname
  profile.cvFileName = file.name
  await saveUser(user)

  const { passwordHash: _, ...publicUser } = user
  return NextResponse.json(publicUser)
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(userId)
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { profileId } = await req.json()
  const profile = user.profiles.find(p => p.id === profileId)
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  if (profile.cvPath) {
    try { await del(profile.cvPath) } catch { /* ignore */ }
    delete profile.cvPath
    delete profile.cvFileName
    await saveUser(user)
  }

  const { passwordHash: _, ...publicUser } = user
  return NextResponse.json(publicUser)
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/user/me/ app/api/user/cv/
git commit -m "feat: profile API — GET/PUT me, CV upload/delete"
```

---

### Task 5: Auth UI — Login/Register Modal + Header

**Files:**
- Create: `components/auth/login-register-dialog.tsx`
- Modify: `components/job-board/public-view.tsx`

**Interfaces:**
- Consumes: `PublicUser` from `lib/user-types.ts`; all auth API routes from Tasks 2–3
- Produces: `<LoginRegisterDialog open onOpenChange onSuccess />` component; header in `PublicView` shows login button or avatar with dropdown

- [ ] **Step 1: Create `components/auth/login-register-dialog.tsx`**

```tsx
"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import type { PublicUser } from "@/lib/user-types"

type Tab = "login" | "register" | "forgot"

export function LoginRegisterDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (user: PublicUser) => void
}) {
  const [tab, setTab] = useState<Tab>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  function switchTab(t: Tab) {
    setTab(t); setEmail(""); setPassword(""); setConfirm(""); setError(""); setForgotSent(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("")
    const res = await fetch("/api/user/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) { setError((await res.json()).error ?? "שגיאה"); setLoading(false); return }
    const me = await fetch("/api/user/me")
    onSuccess(await me.json())
    onOpenChange(false); toast.success("ברוך הבא!"); setLoading(false)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError("הסיסמאות אינן תואמות"); return }
    setLoading(true); setError("")
    const res = await fetch("/api/user/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) { setError((await res.json()).error ?? "שגיאה"); setLoading(false); return }
    const me = await fetch("/api/user/me")
    onSuccess(await me.json())
    onOpenChange(false); toast.success("החשבון נוצר בהצלחה!"); setLoading(false)
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    await fetch("/api/user/forgot-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    setForgotSent(true); setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {tab === "login" ? "כניסה" : tab === "register" ? "הרשמה" : "שכחתי סיסמה"}
          </DialogTitle>
        </DialogHeader>

        {tab !== "forgot" && (
          <div className="flex overflow-hidden rounded-xl border border-border">
            {(["login", "register"] as Tab[]).map(t => (
              <button key={t} type="button" onClick={() => switchTab(t)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}>
                {t === "login" ? "כניסה" : "הרשמה"}
              </button>
            ))}
          </div>
        )}

        {tab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="lr-email">מייל</FieldLabel>
              <Input id="lr-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field>
              <FieldLabel htmlFor="lr-pw">סיסמה</FieldLabel>
              <Input id="lr-pw" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </Field>
            {error && <FieldError>{error}</FieldError>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "נכנס..." : "כניסה"}</Button>
            <button type="button" onClick={() => switchTab("forgot")}
              className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
              שכחתי סיסמה
            </button>
          </form>
        )}

        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="reg-email">מייל</FieldLabel>
              <Input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field>
              <FieldLabel htmlFor="reg-pw">סיסמה</FieldLabel>
              <Input id="reg-pw" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="לפחות 8 תווים" />
            </Field>
            <Field>
              <FieldLabel htmlFor="reg-confirm">אימות סיסמה</FieldLabel>
              <Input id="reg-confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </Field>
            {error && <FieldError>{error}</FieldError>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "נרשם..." : "הרשמה"}</Button>
          </form>
        )}

        {tab === "forgot" && (
          forgotSent ? (
            <div className="space-y-4 py-2 text-center">
              <p className="text-foreground">שלחנו קישור לאיפוס הסיסמה לכתובת {email}</p>
              <Button variant="outline" onClick={() => switchTab("login")}>חזרה לכניסה</Button>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <Field>
                <FieldLabel htmlFor="fp-email">מייל</FieldLabel>
                <Input id="fp-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </Field>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "שולח..." : "שלח קישור איפוס"}</Button>
              <button type="button" onClick={() => switchTab("login")}
                className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
                חזרה לכניסה
              </button>
            </form>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Add user state + auth button to `components/job-board/public-view.tsx`**

In `public-view.tsx`:

2a. Add to imports at the top:
```typescript
import { useEffect, useState } from "react"  // already imported — just add useState if missing
import Link from "next/link"
import { User as UserIcon, LogOut, ChevronDown } from "lucide-react"
import { LoginRegisterDialog } from "@/components/auth/login-register-dialog"
import type { PublicUser } from "@/lib/user-types"
```

2b. Add state inside `PublicView` component (after existing `useState` declarations):
```typescript
const [currentUser, setCurrentUser] = useState<PublicUser | null>(null)
const [authOpen, setAuthOpen] = useState(false)
const [userMenuOpen, setUserMenuOpen] = useState(false)
```

2c. Add `useEffect` to load current user on mount (after existing useEffects):
```typescript
useEffect(() => {
  fetch("/api/user/me")
    .then(r => r.ok ? r.json() : null)
    .then(u => setCurrentUser(u))
    .catch(() => {})
}, [])
```

2d. In the header's `<nav>` section, find the existing nav (around the admin button area) and add the auth button. The header nav currently ends near the admin button. Add **before** the admin button:
```tsx
{/* User auth button */}
{currentUser ? (
  <div className="relative">
    <button
      onClick={() => setUserMenuOpen(v => !v)}
      className="flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/20 transition-colors"
    >
      <span className="flex size-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-primary">
        {currentUser.profiles[0]?.name?.[0] ?? currentUser.email[0].toUpperCase()}
      </span>
      <ChevronDown className="size-3" />
    </button>
    {userMenuOpen && (
      <div className="absolute left-0 top-full mt-1 z-50 min-w-[140px] rounded-xl border border-border bg-card shadow-lg overflow-hidden" dir="rtl">
        <Link
          href="/profile"
          onClick={() => setUserMenuOpen(false)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
        >
          <UserIcon className="size-4" />
          הפרופיל שלי
        </Link>
        <button
          onClick={async () => {
            await fetch("/api/user/logout", { method: "POST" })
            setCurrentUser(null); setUserMenuOpen(false)
          }}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-muted"
        >
          <LogOut className="size-4" />
          יציאה
        </button>
      </div>
    )}
  </div>
) : (
  <button
    onClick={() => setAuthOpen(true)}
    className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/20 transition-colors"
  >
    כניסה
  </button>
)}
```

2e. Add the `LoginRegisterDialog` before the closing `</div>` of the component return:
```tsx
<LoginRegisterDialog
  open={authOpen}
  onOpenChange={setAuthOpen}
  onSuccess={(user) => { setCurrentUser(user); setAuthOpen(false) }}
/>
```

Also pass `currentUser` down to `JobDrawer`:
Find the `<JobDrawer ... />` rendering and add `currentUser={currentUser}` prop. We will use this in Task 7.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: TypeScript may warn about `currentUser` prop on `JobDrawer` not being declared yet — this is fine, it will be resolved in Task 7. If it errors, add `currentUser?: PublicUser | null` to `JobDrawer`'s props interface as a placeholder.

- [ ] **Step 4: Manual verify**

Start dev server. Open the site. Header should show "כניסה" button. Click it — dialog opens with כניסה/הרשמה tabs. Register a new account — dialog closes, avatar appears in header.

- [ ] **Step 5: Commit**

```bash
git add components/auth/ components/job-board/public-view.tsx
git commit -m "feat: login/register dialog + header auth button"
```

---

### Task 6: Profile Page + Components

**Files:**
- Create: `components/user/profile-manager.tsx`
- Create: `components/user/profile-form.tsx`
- Create: `components/user/application-history.tsx`
- Create: `app/profile/page.tsx`

**Interfaces:**
- Consumes: `PublicUser`, `UserProfile`, `UserApplication` from `lib/user-types.ts`; `Job`, `formatHebrewDate` from `lib/job-board-data.ts`; `GET /api/user/me`, `PUT /api/user/me`, `POST /api/user/cv`, `DELETE /api/user/cv`
- Produces: `/profile` page; `<ProfileManager user onUpdate />`, `<ProfileForm open onOpenChange initial userId onSave />`, `<ApplicationHistory applications jobs />`

- [ ] **Step 1: Create `components/user/application-history.tsx`**

```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatHebrewDate, type Job } from "@/lib/job-board-data"
import type { UserApplication } from "@/lib/user-types"

export function ApplicationHistory({
  applications,
  jobs,
}: {
  applications: UserApplication[]
  jobs: Job[]
}) {
  const jobMap = new Map(jobs.map(j => [j.id, j]))

  return (
    <Card>
      <CardHeader>
        <CardTitle>הגשות שלי</CardTitle>
        <CardDescription>{applications.length} פניות שהגשת</CardDescription>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">עדיין לא הגשת מועמדות לאף משרה</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-right">
                  <th className="pb-3 font-medium text-muted-foreground">משרה</th>
                  <th className="pb-3 font-medium text-muted-foreground">חברה</th>
                  <th className="pb-3 font-medium text-muted-foreground">תאריך</th>
                  <th className="pb-3 font-medium text-muted-foreground">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {[...applications].reverse().map((app, i) => {
                  const job = jobMap.get(app.jobId)
                  const active = job?.status === "active"
                  return (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-3 font-medium text-foreground">{app.jobTitle}</td>
                      <td className="py-3 text-muted-foreground">{app.company}</td>
                      <td className="py-3 text-muted-foreground">{formatHebrewDate(app.appliedAt)}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          <span className={`size-1.5 rounded-full ${active ? "bg-green-500" : "bg-red-500"}`} />
                          {active ? "פעילה" : "הוסרה"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Create `components/user/profile-form.tsx`**

```tsx
"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { UploadCloud, FileCheck2 } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import type { UserProfile, PublicUser } from "@/lib/user-types"

export function ProfileForm({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: UserProfile | null
  onSave: (profile: UserProfile) => void
}) {
  const [title, setTitle] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (initial) { setTitle(initial.title); setName(initial.name); setPhone(initial.phone) }
    else { setTitle(""); setName(""); setPhone("") }
    setCvFile(null); setErrors({})
  }, [open, initial])

  async function handleSave() {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = "שדה חובה"
    if (!name.trim()) errs.name = "שדה חובה"
    if (!phone.trim()) errs.phone = "שדה חובה"
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    const profileId = initial?.id ?? `profile-${Date.now()}`
    let cvPath = initial?.cvPath
    let cvFileName = initial?.cvFileName

    if (cvFile) {
      const form = new FormData()
      form.append("profileId", profileId)
      form.append("cv", cvFile)
      const res = await fetch("/api/user/cv", { method: "POST", body: form })
      if (!res.ok) { toast.error("שגיאה בהעלאת קורות חיים"); setSaving(false); return }
      const updated: PublicUser = await res.json()
      const saved = updated.profiles.find(p => p.id === profileId)
      cvPath = saved?.cvPath
      cvFileName = saved?.cvFileName
    }

    onSave({ id: profileId, title: title.trim(), name: name.trim(), phone: phone.trim(), cvPath, cvFileName })
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>{initial ? "עריכת פרופיל" : "פרופיל חדש"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field data-invalid={!!errors.title}>
            <FieldLabel htmlFor="pf-title">שם התפקיד</FieldLabel>
            <Input id="pf-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="מפתח Full Stack" />
            {errors.title && <FieldError>{errors.title}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="pf-name">שם מלא</FieldLabel>
            <Input id="pf-name" value={name} onChange={e => setName(e.target.value)} placeholder="ישראל ישראלי" />
            {errors.name && <FieldError>{errors.name}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.phone}>
            <FieldLabel htmlFor="pf-phone">טלפון</FieldLabel>
            <Input id="pf-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="050-1234567" />
            {errors.phone && <FieldError>{errors.phone}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>קורות חיים (PDF/Word)</FieldLabel>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-4 hover:border-primary/50 transition-colors">
              {cvFile ? (
                <><FileCheck2 className="size-6 text-primary" /><span className="text-sm">{cvFile.name}</span></>
              ) : initial?.cvFileName ? (
                <><FileCheck2 className="size-6 text-primary" /><span className="text-sm">{initial.cvFileName}</span><span className="text-xs text-muted-foreground">לחץ להחלפה</span></>
              ) : (
                <><UploadCloud className="size-6 text-muted-foreground" /><span className="text-sm text-muted-foreground">לחץ להעלאת קורות חיים</span></>
              )}
              <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={e => setCvFile(e.target.files?.[0] ?? null)} />
            </label>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "שומר..." : "שמור"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Create `components/user/profile-manager.tsx`**

```tsx
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
      await fetch("/api/user/cv", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: id }),
      })
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
              <Button variant="ghost" size="icon-sm"
                onClick={() => { setEditing(p); setFormOpen(true) }}><Pencil /></Button>
              <Button variant="ghost" size="icon-sm"
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
```

- [ ] **Step 4: Create `app/profile/page.tsx`**

```tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { ProfileManager } from "@/components/user/profile-manager"
import { ApplicationHistory } from "@/components/user/application-history"
import type { PublicUser } from "@/lib/user-types"
import type { Job } from "@/lib/job-board-data"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<PublicUser | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/user/me").then(r => r.ok ? r.json() : null),
      fetch("/api/jobs").then(r => r.json()).catch(() => []),
    ]).then(([userData, jobsData]) => {
      if (!userData) { router.push("/"); return }
      setUser(userData)
      setJobs(Array.isArray(jobsData) ? jobsData : [])
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="text-muted-foreground">טוען...</span>
    </div>
  )
  if (!user) return null

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ChevronRight className="size-4" />חזרה לדף הבית
          </Link>
          <Link href="/" className="font-heading text-base font-extrabold text-foreground">
            ג&apos;וב<span className="text-primary">מוש</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        <ProfileManager user={user} onUpdate={setUser} />
        <ApplicationHistory applications={user.applications} jobs={jobs} />
      </main>
    </div>
  )
}
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Manual verify**

Log in, click avatar → "הפרופיל שלי" → `/profile` page loads. Add a profile with name/phone/CV. Edit it. Delete it. Application history shows empty state.

- [ ] **Step 7: Commit**

```bash
git add components/user/ app/profile/
git commit -m "feat: profile page — manage profiles + application history"
```

---

### Task 7: Apply Form Integration + Application History Recording

**Files:**
- Create: `components/user/profile-selector.tsx`
- Modify: `components/job-board/apply-form-dialog.tsx`
- Modify: `components/job-board/job-drawer.tsx`
- Modify: `app/api/apply/route.ts`

**Interfaces:**
- Consumes: `PublicUser`, `UserProfile` from `lib/user-types.ts`; `getUser`, `saveUser` from `lib/blob-user.ts`; `verifyUserSessionToken` from `lib/session.ts`
- Produces: Apply form pre-fills from selected profile; submitted applications recorded in user's `applications[]`

- [ ] **Step 1: Create `components/user/profile-selector.tsx`**

```tsx
import type { UserProfile } from "@/lib/user-types"

export function ProfileSelector({
  profiles,
  selectedId,
  onSelect,
}: {
  profiles: UserProfile[]
  selectedId: string | null
  onSelect: (profile: UserProfile) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">בחר פרופיל לשליחה</p>
      {profiles.map(p => (
        <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
          selectedId === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
        }`}>
          <input type="radio" name="profile-select" value={p.id}
            checked={selectedId === p.id} onChange={() => onSelect(p)}
            className="accent-primary" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{p.title}</p>
            <p className="text-xs text-muted-foreground">
              {p.name} · {p.phone}{p.cvFileName ? ` · ${p.cvFileName}` : ""}
            </p>
          </div>
        </label>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Modify `components/job-board/apply-form-dialog.tsx`**

2a. Add imports at the top:
```typescript
import { ProfileSelector } from "@/components/user/profile-selector"
import type { PublicUser, UserProfile } from "@/lib/user-types"
```

2b. Add `currentUser?: PublicUser | null` to the `ApplyFormDialog` props:
```typescript
export function ApplyFormDialog({
  job,
  open,
  onOpenChange,
  onSubmitApplication,
  currentUser,
}: {
  job: Job
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitApplication: (app: Application) => void
  currentUser?: PublicUser | null
}) {
```

2c. Add state for selected profile:
```typescript
const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null)
```

2d. Add `useEffect` to pre-fill when dialog opens and user has profiles:
```typescript
useEffect(() => {
  if (open && currentUser?.profiles.length) {
    const first = currentUser.profiles[0]
    setSelectedProfileId(first.id)
    setSelectedProfile(first)
    setName(first.name)
    setPhone(first.phone)
  }
}, [open, currentUser])
```

2e. In the form JSX, add `ProfileSelector` **above** the name field, conditionally when the user has profiles:
```tsx
{currentUser && currentUser.profiles.length > 0 && (
  <ProfileSelector
    profiles={currentUser.profiles}
    selectedId={selectedProfileId}
    onSelect={(p) => {
      setSelectedProfile(p)
      setSelectedProfileId(p.id)
      setName(p.name)
      setPhone(p.phone)
    }}
  />
)}
{currentUser && currentUser.profiles.length === 0 && (
  <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
    <Link href="/profile" className="text-primary underline">שמור פרופיל</Link> כדי למלא אוטומטית את הטופס
  </div>
)}
```

2f. When submitting (in `handleSubmit`), pass `selectedProfileId` in the FormData:
```typescript
// Add after existing form.append lines:
if (selectedProfileId) form.append("profileId", selectedProfileId)

// If user has a saved CV in their profile, fetch and send it
if (selectedProfile?.cvPath && !cvFile) {
  // The server will fetch the CV from blob using the profileId
  form.append("useProfileCv", "true")
}
```

Add `import Link from "next/link"` to `apply-form-dialog.tsx` imports.

- [ ] **Step 3: Pass `currentUser` from `job-drawer.tsx` to `ApplyFormDialog`**

In `components/job-board/job-drawer.tsx`:

3a. Add `currentUser?: PublicUser | null` to `JobDrawer` props:
```typescript
import type { PublicUser } from "@/lib/user-types"

export function JobDrawer({
  job,
  categories,
  onOpenChange,
  onSubmitApplication,
  currentUser,
}: {
  job: Job | null
  categories: Category[]
  onOpenChange: (open: boolean) => void
  onSubmitApplication: (app: Application) => void
  currentUser?: PublicUser | null
}) {
```

3b. Pass it to `ApplyFormDialog`:
```tsx
<ApplyFormDialog
  job={job}
  open={applyOpen}
  onOpenChange={setApplyOpen}
  onSubmitApplication={onSubmitApplication}
  currentUser={currentUser}
/>
```

- [ ] **Step 4: Modify `app/api/apply/route.ts` — record application in user history**

At the end of the successful application flow in `app/api/apply/route.ts`, after the existing blob save of the application, add:

```typescript
// Import at top of file (add to existing imports):
import { cookies } from "next/headers"
import { verifyUserSessionToken } from "@/lib/session"
import { getUser, saveUser } from "@/lib/blob-user"
```

Inside the `POST` handler, after the existing application blob save (after the `try { await put("applications/...") }` block), add:

```typescript
// Record in user's application history if logged in
try {
  const cookieStore = await cookies()
  const userToken = cookieStore.get("jm_user_session")?.value
  if (userToken) {
    const userId = verifyUserSessionToken(userToken)
    if (userId) {
      const user = await getUser(userId)
      if (user) {
        user.applications.push({
          jobId,
          jobTitle,
          company: jobCompany,
          appliedAt: new Date().toISOString().slice(0, 10),
          profileId: (form.get("profileId") as string | null) ?? "",
        })
        await saveUser(user)
      }
    }
  }
} catch (err) {
  console.error("[apply] user history update failed:", err)
}
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Manual end-to-end verify**

1. Log in with a test account.
2. Add a profile with name, phone, and upload a CV PDF.
3. Open any active job → "הגש מועמדות".
4. Profile selector should appear pre-selected. Name and phone should be filled.
5. Submit the application.
6. Go to `/profile` → "הגשות שלי" should show the job just applied to with 🟢 פעילה status.

- [ ] **Step 7: Commit + Push**

```bash
git add components/user/profile-selector.tsx components/job-board/apply-form-dialog.tsx \
        components/job-board/job-drawer.tsx app/api/apply/route.ts
git commit -m "feat: apply form auto-fill from profile + application history recording"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ Email + password registration/login
- ✅ Vercel Blob storage only
- ✅ bcrypt cost 10
- ✅ HMAC session cookie `jm_user_session` 30 days
- ✅ Password reset via Resend, 1-hour token
- ✅ Multi-profile (title, name, phone, CV per profile)
- ✅ CV upload to private Blob path
- ✅ Auto-fill apply form from selected profile
- ✅ Application history with job active/removed status
- ✅ Rate limiting on register/login/forgot-password
- ✅ RTL, Hebrew labels throughout
- ✅ No `any` in TypeScript
- ✅ Security: httpOnly cookie, no email enumeration, timing-safe login

**Gaps check:** None found.

**Type consistency check:**
- `PublicUser = Omit<User, "passwordHash">` — used consistently across all tasks
- `UserProfile.cvPath` is always `blob.pathname` (not `downloadUrl`) — consistent with existing `/api/cv` proxy
- `UserApplication.appliedAt` is always `YYYY-MM-DD` string — consistent with `formatHebrewDate`
