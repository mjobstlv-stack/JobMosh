import { NextResponse } from "next/server"
import { list } from "@vercel/blob"

export const runtime = "nodejs"

export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json([])
  }
  try {
    const { blobs } = await list({ prefix: "applications/" })
    const applications = await Promise.all(
      blobs.map((blob) => fetch(blob.url).then((r) => r.json())),
    )
    // newest first
    applications.sort((a, b) => (b.id > a.id ? 1 : -1))
    return NextResponse.json(applications)
  } catch (err) {
    console.error("[applications] blob read failed:", err)
    return NextResponse.json([])
  }
}
