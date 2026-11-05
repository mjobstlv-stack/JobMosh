/**
 * CV upload validation. The browser-supplied MIME type (File.type) is
 * attacker-controlled, so we check the file extension AND its magic bytes,
 * and store it with a content type we derive ourselves.
 */
export const MAX_CV_BYTES = 5 * 1024 * 1024 // 5 MB

const KINDS = {
  pdf: { contentType: "application/pdf", magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  doc: { contentType: "application/msword", magic: [0xd0, 0xcf, 0x11, 0xe0] }, // OLE2
  docx: {
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    magic: [0x50, 0x4b, 0x03, 0x04], // ZIP
  },
} as const

export const CV_CONTENT_TYPES = new Set<string>(Object.values(KINDS).map((k) => k.contentType))

export type CvCheck = { ok: true; contentType: string; bytes: Buffer } | { ok: false; error: string }

export async function validateCvFile(file: File): Promise<CvCheck> {
  if (file.size > MAX_CV_BYTES) return { ok: false, error: "הקובץ גדול מדי — מקסימום 5MB" }
  const ext = file.name.toLowerCase().split(".").pop() ?? ""
  const kind = KINDS[ext as keyof typeof KINDS]
  const bytes = Buffer.from(await file.arrayBuffer())
  if (!kind || !kind.magic.every((b, i) => bytes[i] === b)) {
    return { ok: false, error: "סוג קובץ לא נתמך — יש להעלות PDF או Word בלבד" }
  }
  return { ok: true, contentType: kind.contentType, bytes }
}

/** Safe blob filename: Hebrew/ASCII word chars, dots, hyphens; no path traversal. */
export function sanitizeFilename(name: string): string {
  return name.replace(/\.\./g, "_").replace(/[^\wא-ת.\-]/g, "_").slice(0, 100)
}
