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
