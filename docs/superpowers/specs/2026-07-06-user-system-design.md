# User System Implementation Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a user account system to JobMosh — registration, login, multi-profile management, auto-fill on job applications, and application history.

**Architecture:** Email + password auth, sessions via HMAC cookies (same pattern as existing admin), all user data stored in Vercel Blob as private JSON files. No new paid services.

**Tech Stack:** Next.js 15 App Router, bcryptjs, Resend (already integrated), Vercel Blob (already integrated)

---

## Global Constraints

- Storage: Vercel Blob only — no new database services
- Auth: Email + password with bcrypt hashing (cost factor 10)
- Sessions: HMAC cookie `jm_user_session`, 30-day expiry, same lib/session.ts pattern as admin
- Password reset: Time-limited tokens (1 hour) stored in Blob, sent via Resend
- All user Blob paths are `access: "private"`
- Hebrew RTL UI throughout — `dir="rtl"` on all new components
- TypeScript strict — no `any`
- Tailwind v4 + shadcn/ui components only

---

## Data Model

### User file — `users/{userId}.json`

```json
{
  "id": "user-1720123456789",
  "email": "user@gmail.com",
  "passwordHash": "$2b$10$...",
  "createdAt": "2026-07-06",
  "profiles": [
    {
      "id": "profile-1720123456789",
      "title": "מפתח Full Stack",
      "name": "ישראל ישראלי",
      "phone": "050-1234567",
      "cvPath": "cv/users/user-1720.../profile-1720....pdf",
      "cvFileName": "cv-developer.pdf"
    }
  ],
  "applications": [
    {
      "jobId": "job-123",
      "jobTitle": "מפתח React",
      "company": "סטארטאפ בע״מ",
      "appliedAt": "2026-07-06",
      "profileId": "profile-1720123456789"
    }
  ]
}
```

### Email lookup file — `users/lookup/{sha256(email)}.json`

```json
{ "userId": "user-1720123456789" }
```

Purpose: O(1) lookup of userId by email without scanning all users.
The key is `sha256(email.toLowerCase())` encoded as hex — avoids special characters in Blob paths.

### Password reset token — `users/reset-tokens/{token}.json`

```json
{
  "userId": "user-1720123456789",
  "expiresAt": 1720130000000
}
```

Token is 32 random bytes encoded as hex. Expires after 1 hour. Deleted after use.

---

## TypeScript Types

```typescript
// lib/user-types.ts
export type UserProfile = {
  id: string
  title: string        // e.g. "מפתח Full Stack"
  name: string
  phone: string
  cvPath?: string      // Blob pathname
  cvFileName?: string
}

export type UserApplication = {
  jobId: string
  jobTitle: string
  company: string
  appliedAt: string    // ISO date YYYY-MM-DD
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
```

---

## API Routes

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/user/register` | POST | — | Create account, return session cookie |
| `/api/user/login` | POST | — | Verify credentials, return session cookie |
| `/api/user/logout` | POST | user | Clear `jm_user_session` cookie |
| `/api/user/me` | GET | user | Return user data (no passwordHash) |
| `/api/user/me` | PUT | user | Update profiles list |
| `/api/user/cv` | POST | user | Upload CV for a profile, return updated user |
| `/api/user/cv` | DELETE | user | Delete CV for a profile |
| `/api/user/forgot-password` | POST | — | Send reset email via Resend |
| `/api/user/reset-password` | POST | — | Validate token, update password hash |

### Session format
`jm_user_session` cookie value: `{userId}|{expires}|{hmac_sig}`
Extend `lib/session.ts` with `createUserSessionToken(userId)` and `verifyUserSessionToken(token) → userId | null`.

---

## New Files

```
lib/
  user-types.ts              ← User, UserProfile, UserApplication types
  blob-user.ts               ← getUser, saveUser, getUserByEmail, deleteResetToken helpers

app/
  profile/
    page.tsx                 ← Protected: profile management + application history
  reset-password/
    page.tsx                 ← Public: enter new password from email link
  api/user/
    register/route.ts
    login/route.ts
    logout/route.ts
    me/route.ts              ← GET + PUT
    cv/route.ts              ← POST + DELETE
    forgot-password/route.ts
    reset-password/route.ts

components/
  auth/
    login-register-dialog.tsx  ← Modal with tabs: כניסה / הרשמה / שכחתי סיסמה
  user/
    profile-manager.tsx        ← List of profiles with add/edit/delete
    profile-form.tsx           ← Form for single profile (title, name, phone, CV upload)
    application-history.tsx    ← Table of past applications with job status
    profile-selector.tsx       ← Shown in apply-form-dialog when user is logged in
```

### Modified Files

| File | Change |
|---|---|
| `lib/session.ts` | Add `createUserSessionToken(userId)`, `verifyUserSessionToken(token)` |
| `components/job-board/public-view.tsx` | Add login button + user avatar in header; pass user context down |
| `components/job-board/apply-form-dialog.tsx` | If user logged in: show `ProfileSelector` instead of blank form |
| `app/api/apply/route.ts` | If `jm_user_session` cookie present: append application to user history |

---

## Auth Flow

### Registration
1. POST `/api/user/register` with `{ email, password }`
2. Check if `users/lookup/{sha256(email)}.json` exists → if yes, return 409 "מייל כבר קיים"
3. Hash password with bcrypt (cost 10)
4. Generate userId: `user-${Date.now()}`
5. Save `users/{userId}.json` and `users/lookup/{sha256(email)}.json`
6. Set `jm_user_session` cookie, return `{ ok: true }`

### Login
1. POST `/api/user/login` with `{ email, password }`
2. Lookup userId from `users/lookup/{sha256(email)}.json`
3. Load user file, compare password with bcrypt.compare
4. If valid: set `jm_user_session` cookie, return `{ ok: true }`
5. If invalid: return 401 (same message for both "no user" and "wrong password" — prevents email enumeration)

### Password Reset
1. POST `/api/user/forgot-password` with `{ email }`
2. Always return 200 (no enumeration) — only send email if user exists
3. Generate 32-byte random token, store in `users/reset-tokens/{token}.json` with 1h expiry
4. Send email via Resend: "איפוס סיסמה — jobmosh.co.il" with link to `/reset-password?token=...`
5. POST `/api/user/reset-password` with `{ token, newPassword }`
6. Load and validate token (exists + not expired)
7. Hash new password, update user file, delete token file

---

## UI

### Header
- Not logged in: כפתור "כניסה" קטן בצד שמאל של ה-header
- Logged in: אווטר עגול עם ראשי תיבות שם + dropdown: "הפרופיל שלי" / "יציאה"

### Login/Register Modal (`login-register-dialog.tsx`)
Three tabs:
- **כניסה** — email + password + "שכחתי סיסמה"
- **הרשמה** — email + password + confirm password
- **שכחתי סיסמה** — email only, shows "נשלח מייל" confirmation

### Profile Page (`/profile`)
Two sections:
1. **הפרופילים שלי** — cards per profile with edit/delete. "+ הוסף פרופיל" button opens `ProfileForm` dialog
2. **הגשות שלי** — table: משרה | חברה | תאריך | סטטוס (🟢 פעילה / 🔴 הוסרה)

### Apply Form with Auto-fill
When user is logged in and opens apply dialog:
- Show `ProfileSelector` — radio list of profiles
- On select: pre-fill name + phone from profile, attach saved CV
- User can add a free-text message and submit

If no profiles saved yet: show inline prompt "שמור פרופיל לפני שליחה ← הפרופיל שלי"

---

## Security Notes

- Passwords: bcrypt cost 10 — secure against brute force
- Session cookie: `httpOnly`, `sameSite: "lax"`, `secure` in production
- Email enumeration: Registration, login, and password-reset all return generic messages
- Reset tokens: Single-use, deleted immediately after use, 1-hour TTL
- CV files: `access: "private"` — served only through `/api/cv` proxy (already built)
- User files: `access: "private"` — never exposed directly
- Rate limiting: Register + login + forgot-password endpoints limited to 5 req/min per IP (same pattern as apply route)

---

## Out of Scope

- OAuth (Google/Apple login)
- Email verification on registration
- Admin view of user accounts
- Map view of jobs
