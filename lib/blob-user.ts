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
    allowOverwrite: true,
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
