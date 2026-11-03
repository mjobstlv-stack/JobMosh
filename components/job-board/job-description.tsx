import { Fragment } from "react"
import { BULLET_RE, cn, stripBullet } from "@/lib/utils"

type Block =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; lines: string[] }
  | { kind: "list"; ordered: boolean; items: string[] }

const ORDERED_RE = /^\s*\d{1,2}[.)]\s+/
const MAX_HEADING_LENGTH = 40

function isHeading(line: string): boolean {
  return line.length <= MAX_HEADING_LENGTH && /[:：]$/.test(line)
}

/**
 * Turns the free text typed in the admin form into blocks:
 * blank line → new paragraph, "- item" / "1. item" → list, short "Title:" line → heading.
 */
export function parseDescription(text: string): Block[] {
  const blocks: Block[] = []
  let current: Block | null = null

  const flush = () => {
    if (current) blocks.push(current)
    current = null
  }

  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim()

    if (!line) {
      flush()
      continue
    }

    if (BULLET_RE.test(line)) {
      const ordered = ORDERED_RE.test(line)
      if (current?.kind !== "list" || current.ordered !== ordered) {
        flush()
        current = { kind: "list", ordered, items: [] }
      }
      current.items.push(stripBullet(line))
      continue
    }

    if (isHeading(line)) {
      flush()
      blocks.push({ kind: "heading", text: line.replace(/[:：]$/, "") })
      continue
    }

    if (current?.kind !== "paragraph") {
      flush()
      current = { kind: "paragraph", lines: [] }
    }
    current.lines.push(line)
  }
  flush()
  return blocks
}

export function JobDescription({
  text,
  size = "sm",
  className,
}: {
  text: string
  size?: "sm" | "base"
  className?: string
}) {
  const blocks = parseDescription(text)
  const textSize = size === "sm" ? "text-sm leading-7" : "text-[15px] leading-8"

  return (
    <div dir="rtl" className={cn("flex flex-col gap-3 text-start text-foreground/80", textSize, className)}>
      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          return (
            <h4
              key={i}
              className={cn(
                "font-heading font-semibold text-foreground",
                i > 0 && "mt-2",
                size === "sm" ? "text-sm" : "text-base",
              )}
            >
              {block.text}
            </h4>
          )
        }

        if (block.kind === "list") {
          const List = block.ordered ? "ol" : "ul"
          return (
            <List key={i} className="flex flex-col gap-1.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2.5">
                  {block.ordered ? (
                    <span className="min-w-4 shrink-0 font-semibold text-primary">{j + 1}.</span>
                  ) : (
                    <span
                      aria-hidden
                      className={cn("size-1.5 shrink-0 rounded-full bg-primary", size === "sm" ? "mt-[11px]" : "mt-[13px]")}
                    />
                  )}
                  <span>{item}</span>
                </li>
              ))}
            </List>
          )
        }

        return (
          <p key={i}>
            {block.lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
