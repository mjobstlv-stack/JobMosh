import { createHmac, timingSafeEqual } from "node:crypto"

/** Constant-time string comparison — prevents timing-based credential extraction. */
export function safeEqual(a: string, b: string): boolean {
  // Hash both strings so buffers are always the same length
  const ha = createHmac("sha256", "jm-compare").update(a).digest()
  const hb = createHmac("sha256", "jm-compare").update(b).digest()
  return timingSafeEqual(ha, hb)
}

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

function getSecret(): string {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error("SESSION_SECRET is not set")
  return s
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_DURATION_MS
  const payload = String(expires)
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex")
  return `${payload}.${sig}`
}

export function verifySessionToken(token: string): boolean {
  const dot = token.lastIndexOf(".")
  if (dot === -1) return false

  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  const expires = parseInt(payload, 10)
  if (isNaN(expires) || Date.now() > expires) return false

  const expected = createHmac("sha256", getSecret()).update(payload).digest("hex")

  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))
  } catch {
    return false
  }
}

const STAFF_SESSION_DURATION_MS = 12 * 60 * 60 * 1000 // 12 hours

export function createStaffToken(staffId: string): string {
  const expires = Date.now() + STAFF_SESSION_DURATION_MS
  const payload = `${staffId}|${expires}`
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex")
  return `${payload}|${sig}`
}

export function verifyStaffToken(token: string): string | null {
  const lastPipe = token.lastIndexOf("|")
  if (lastPipe === -1) return null
  const payload = token.slice(0, lastPipe)
  const sig = token.slice(lastPipe + 1)
  const pipeIdx = payload.indexOf("|")
  if (pipeIdx === -1) return null
  const staffId = payload.slice(0, pipeIdx)
  const expires = parseInt(payload.slice(pipeIdx + 1), 10)
  if (isNaN(expires) || Date.now() > expires) return null
  const expected = createHmac("sha256", getSecret()).update(payload).digest("hex")
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null
  } catch {
    return null
  }
  return staffId
}

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
