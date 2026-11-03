import { Fragment } from "react"
import { cn } from "@/lib/utils"
import { parseDescription } from "@/lib/job-text"

/** Renders **bold** segments as <strong>; any stray "**" is dropped. */
export function InlineText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-foreground">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part.replace(/\*\*/g, "")}</Fragment>
        ),
      )}
    </>
  )
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
              <InlineText text={block.text} />
            </h4>
          )
        }

        if (block.kind === "list") {
          const List = block.ordered ? "ol" : "ul"
          return (
            <List key={i} className="flex flex-col gap-1">
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
                  <span>
                    <InlineText text={item} />
                  </span>
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
                <InlineText text={line} />
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
