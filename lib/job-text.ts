// Parsing helpers for the free-form job text the admin types (or pastes from WhatsApp/Facebook):
// blank lines, "-"/"•"/emoji bullets, "1." numbering, "### Title", "**bold**" and
// short "מה כולל התפקיד?" style headings.

// Text bullets need a space after them ("- item"); emoji/check bullets don't ("✅item").
const TEXT_BULLET = String.raw`(?:[-•*–—·▪▫◾◽►▸▹➤➢➔→]|\d{1,2}[.)])\s+`
const EMOJI_BULLET = String.raw`[✓✔☑✅✨⭐★🔹🔸🔷🔶👉💎🟢🟩]️?\s*`
const BULLET_RE = new RegExp(String.raw`^\s*(?:${TEXT_BULLET}|${EMOJI_BULLET})`, "u")
const ORDERED_RE = /^\s*\d{1,2}[.)]\s+/
const MD_HEADING_RE = /^#{1,4}\s+/
const EMOJI_RE = /[\p{Extended_Pictographic}️‍]/gu
const STARTS_WITH_EMOJI_RE = /^\p{Extended_Pictographic}/u
const MAX_HEADING_LENGTH = 45

export type Block =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; lines: string[] }
  | { kind: "list"; ordered: boolean; items: string[] }

export function isBullet(line: string): boolean {
  return BULLET_RE.test(line)
}

/** Removes a leading bullet / list number / check emoji from a single line. */
export function stripBullet(line: string): string {
  return line.replace(BULLET_RE, "").trim()
}

function stripMarkdown(text: string): string {
  return text.replace(/\*\*/g, "").replace(MD_HEADING_RE, "")
}

function plainLength(line: string): number {
  return stripMarkdown(line).replace(EMOJI_RE, "").trim().length
}

const QUESTION_WORD_RE = /^(?:מה|מי|למה|למי|איך|מדוע|כמה|איפה)\s/

/**
 * A short line ending with ":" or "?" is treated as a heading when:
 * it opens with an emoji ("🔧 מה כולל התפקיד?"), a list follows it, it stands alone,
 * or it opens a block and is clearly a label ("תנאי המשרה:" / "מה מחכה לכם?").
 */
function looksLikeHeading(
  line: string,
  ctx: { blankBefore: boolean; nextRaw: string | undefined; nextNonEmpty: string | undefined },
): boolean {
  if (MD_HEADING_RE.test(line)) return true
  if (plainLength(line) > MAX_HEADING_LENGTH) return false
  if (!/[:：?]\**$/.test(line)) return false
  if (STARTS_WITH_EMOJI_RE.test(line)) return true
  if (ctx.nextNonEmpty !== undefined && isBullet(ctx.nextNonEmpty)) return true
  if (!ctx.blankBefore) return false
  const standsAlone = !ctx.nextRaw
  const isLabel = /[:：]\**$/.test(line) || QUESTION_WORD_RE.test(stripMarkdown(line))
  return standsAlone || isLabel
}

/** True for a requirement line that is really a section title ("מה אנחנו מחפשים?"). */
export function isSectionTitle(line: string): boolean {
  const plain = stripMarkdown(line).replace(EMOJI_RE, "").trim()
  return plain.length <= 30 && /[:：?]$/.test(plain) && (plain.endsWith(":") || QUESTION_WORD_RE.test(plain))
}

function cleanHeading(line: string): string {
  return stripMarkdown(line).trim().replace(/[:：]$/, "")
}

export function parseDescription(text: string): Block[] {
  // Trailing "|" separators are leftovers from one-line social posts.
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.trim().replace(/\s*\|+$/, ""))
  const nextNonEmpty = (from: number) => lines.slice(from + 1).find(Boolean)

  const blocks: Block[] = []
  let current: Block | null = null
  let sawBlank = false

  const flush = () => {
    if (!current) return
    // Several plain lines right under a heading are a list in all but name.
    if (current.kind === "paragraph" && current.lines.length >= 2 && blocks.at(-1)?.kind === "heading") {
      blocks.push({ kind: "list", ordered: false, items: current.lines })
    } else {
      blocks.push(current)
    }
    current = null
  }

  lines.forEach((line, i) => {
    if (!line) {
      sawBlank = true
      return
    }
    const blankBefore = sawBlank
    sawBlank = false

    if (isBullet(line)) {
      const ordered = ORDERED_RE.test(line)
      // Bullets separated by blank lines still form one list.
      if (current?.kind !== "list" || current.ordered !== ordered) {
        flush()
        current = { kind: "list", ordered, items: [] }
      }
      current.items.push(stripBullet(line))
      return
    }

    const blankBeforeOrStart = blankBefore || current === null
    if (looksLikeHeading(line, { blankBefore: blankBeforeOrStart, nextRaw: lines[i + 1], nextNonEmpty: nextNonEmpty(i) })) {
      flush()
      blocks.push({ kind: "heading", text: cleanHeading(line) })
      return
    }

    if (current?.kind !== "paragraph" || blankBefore) {
      flush()
      current = { kind: "paragraph", lines: [] }
    }
    current.lines.push(line)
  })
  flush()
  return mergeOneLinersUnderHeadings(blocks)
}

/** Short line, or a "label: value" line ("שכר: 45 ש״ח לשעה") — reads like a list item, not prose. */
function isListLikeLine(line: string): boolean {
  const plain = toPlainText(line)
  return plain.length <= 60 || (plain.length <= 120 && /^[^:]{2,25}:\s/.test(plain))
}

/** Heading followed by 2+ single-line paragraphs ("שכר: ...", "בונוסים ...") → one list. */
function mergeOneLinersUnderHeadings(blocks: Block[]): Block[] {
  const out: Block[] = []
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    out.push(block)
    if (block.kind !== "heading") continue

    const items: string[] = []
    let j = i + 1
    while (j < blocks.length) {
      const next = blocks[j]
      if (next.kind !== "paragraph" || next.lines.length !== 1 || !isListLikeLine(next.lines[0])) break
      items.push(next.lines[0])
      j++
    }
    if (items.length >= 2) {
      out.push({ kind: "list", ordered: false, items })
      i = j - 1
    }
  }
  return out
}

/** Plain, emoji-free text for previews and meta tags. */
export function toPlainText(text: string): string {
  return stripMarkdown(text).replace(EMOJI_RE, "").replace(/\s+/g, " ").trim()
}

/**
 * Short, clean teaser for the job card: the opening paragraph(s) only —
 * no headings, bullets, emojis or markdown — so it reads as a sentence.
 */
export function toPreview(text: string, minLength = 90): string {
  const blocks = parseDescription(text)
  const parts: string[] = []
  let length = 0

  // Lines without closing punctuation get a period so joined lines still read as sentences.
  const sentence = (line: string) => {
    const plain = toPlainText(line).replace(/\s*[|·•\-–—]+$/, "").trim()
    return !plain || /[.!?:,;…]$/.test(plain) ? plain : `${plain}.`
  }

  for (const block of blocks) {
    if (block.kind !== "paragraph") continue
    const plain = block.lines.map(sentence).filter(Boolean).join(" ")
    if (!plain) continue
    parts.push(plain)
    length += plain.length
    if (length >= minLength) break
  }

  if (parts.length === 0) {
    const firstList = blocks.find((b) => b.kind === "list")
    if (firstList?.kind === "list") return firstList.items.map(toPlainText).join(" · ")
  }
  return parts.join(" ")
}
