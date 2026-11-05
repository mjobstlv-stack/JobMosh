/**
 * Fixed-window rate limiter.
 *
 * On Vercel every request may hit a different serverless instance, so an
 * in-memory counter alone barely limits anything. When a Redis REST endpoint
 * is configured (Upstash via the Vercel Marketplace — it sets either
 * UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN) the counter is shared
 * across all instances. Without it we fall back to per-instance memory.
 * If Redis is configured but unreachable we fail open (allow), so an outage
 * of the limiter never locks everyone out of the site.
 */
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || ""
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ""

const memory = new Map<string, { count: number; resetAt: number }>()

function memoryHit(key: string, windowMs: number): number {
  const now = Date.now()
  const entry = memory.get(key)
  if (!entry || now > entry.resetAt) {
    memory.set(key, { count: 1, resetAt: now + windowMs })
    if (memory.size > 10_000) memory.clear() // crude bound on memory use
    return 1
  }
  entry.count++
  return entry.count
}

async function redisHit(key: string, windowSec: number): Promise<number | null> {
  try {
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSec), "NX"],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { result?: unknown }[]
    const count = Number(data?.[0]?.result)
    return Number.isFinite(count) ? count : null
  } catch {
    return null
  }
}

/** Client IP as seen by Vercel's edge (first x-forwarded-for entry). */
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}

/**
 * Counts one hit for `bucket:id` and returns true while the caller is within
 * `limit` hits per `windowSec`.
 */
export async function rateLimit(
  bucket: string,
  id: string,
  limit: number,
  windowSec: number,
): Promise<boolean> {
  const key = `rl:${bucket}:${id}`
  if (REDIS_URL && REDIS_TOKEN) {
    const count = await redisHit(key, windowSec)
    if (count !== null) return count <= limit
  }
  return memoryHit(key, windowSec * 1000) <= limit
}

export const isDistributedRateLimit = Boolean(REDIS_URL && REDIS_TOKEN)
