import { get } from "@vercel/blob"
import { DEFAULT_SETTINGS, normalizeSettings, type GlobalSettings } from "@/lib/job-board-data"

export const SETTINGS_BLOB_PATH = "config/settings.json"

/** Site-wide settings (job alerts toggle, nav items) stored in Blob, merged over defaults. */
export async function getSettings(): Promise<GlobalSettings> {
  try {
    const result = await get(SETTINGS_BLOB_PATH, { access: "private" })
    if (!result) return DEFAULT_SETTINGS
    const text = await new Response(result.stream).text()
    return normalizeSettings(JSON.parse(text))
  } catch {
    return DEFAULT_SETTINGS
  }
}
