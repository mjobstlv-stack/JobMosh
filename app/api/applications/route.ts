import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export const runtime = "nodejs"

export async function GET() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json([])
  }
  try {
    const applications = await kv.lrange("jm:applications", 0, -1)
    return NextResponse.json(applications)
  } catch (err) {
    console.error("[applications] kv read failed:", err)
    return NextResponse.json([])
  }
}
