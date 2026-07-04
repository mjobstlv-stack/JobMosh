"use client"

import { useEffect, useState } from "react"
import { Accessibility, Minus, Plus, RotateCcw, X } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────

type FontSize = 0 | 1 | 2 // 0 = normal, 1 = large, 2 = very large

type A11yState = {
  fontSize: FontSize
  highContrast: boolean
  grayscale: boolean
  underlineLinks: boolean
  readableFont: boolean
  noAnimations: boolean
  highlightFocus: boolean
  lineSpacing: boolean
}

const DEFAULT: A11yState = {
  fontSize: 0,
  highContrast: false,
  grayscale: false,
  underlineLinks: false,
  readableFont: false,
  noAnimations: false,
  highlightFocus: false,
  lineSpacing: false,
}

const STORAGE_KEY = "jm_a11y"

// ── Apply settings to <html> ───────────────────────────────────────────────

function applySettings(s: A11yState) {
  const html = document.documentElement

  // Font size via classes
  html.classList.remove("a11y-text-lg", "a11y-text-xl")
  if (s.fontSize === 1) html.classList.add("a11y-text-lg")
  if (s.fontSize === 2) html.classList.add("a11y-text-xl")

  // Toggle classes
  html.classList.toggle("a11y-underline-links", s.underlineLinks)
  html.classList.toggle("a11y-readable-font", s.readableFont)
  html.classList.toggle("a11y-no-animations", s.noAnimations)
  html.classList.toggle("a11y-highlight-focus", s.highlightFocus)
  html.classList.toggle("a11y-line-spacing", s.lineSpacing)

  // Combine contrast + grayscale filters
  const filters: string[] = []
  if (s.highContrast) filters.push("contrast(1.5)")
  if (s.grayscale) filters.push("grayscale(1)")
  html.style.filter = filters.join(" ")
}

// ── Toggle button ──────────────────────────────────────────────────────────

function ToggleBtn({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-right text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      aria-pressed={active}
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold transition-all",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border",
        )}
      >
        {active ? "✓" : ""}
      </span>
      {label}
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function AccessibilityMenu() {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<A11yState>(DEFAULT)
  const [mounted, setMounted] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: A11yState = { ...DEFAULT, ...JSON.parse(stored) }
        setSettings(parsed)
        applySettings(parsed)
      }
    } catch {}
    setMounted(true)
  }, [])

  function update(patch: Partial<A11yState>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      applySettings(next)
      return next
    })
  }

  function reset() {
    setSettings(DEFAULT)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
    applySettings(DEFAULT)
  }

  if (!mounted) return null

  const isModified = JSON.stringify(settings) !== JSON.stringify(DEFAULT)

  const fontLabels: Record<FontSize, string> = { 0: "רגיל", 1: "גדול", 2: "גדול מאוד" }

  const toggles: { label: string; key: keyof Omit<A11yState, "fontSize"> }[] = [
    { label: "ניגודיות גבוהה", key: "highContrast" },
    { label: "גוון אפור", key: "grayscale" },
    { label: "הדגשת קישורים", key: "underlineLinks" },
    { label: "גופן קריא", key: "readableFont" },
    { label: "עצירת אנימציות", key: "noAnimations" },
    { label: "הדגשת פוקוס", key: "highlightFocus" },
    { label: "מרווח שורות", key: "lineSpacing" },
  ]

  return (
    <div className="fixed bottom-5 left-4 z-50" dir="rtl">
      {/* Panel */}
      {open && (
        <div className="mb-3 w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Accessibility className="size-4 text-primary" />
              <span className="font-heading text-sm font-bold text-foreground">
                תפריט נגישות
              </span>
            </div>
            <div className="flex items-center gap-1">
              {isModified && (
                <button
                  type="button"
                  onClick={reset}
                  title="איפוס כל ההגדרות"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="איפוס כל ההגדרות"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="סגור תפריט נגישות"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Font size */}
            <div>
              <p className="mb-2.5 text-xs font-semibold text-muted-foreground">
                גודל טקסט
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    update({ fontSize: Math.max(0, settings.fontSize - 1) as FontSize })
                  }
                  disabled={settings.fontSize === 0}
                  aria-label="הקטן טקסט"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted disabled:opacity-30"
                >
                  <Minus className="size-3.5" />
                </button>

                <div className="flex flex-1 gap-1">
                  {([0, 1, 2] as FontSize[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => update({ fontSize: level })}
                      aria-pressed={settings.fontSize === level}
                      className={cn(
                        "flex-1 rounded-lg border py-1.5 text-xs font-medium transition-all",
                        settings.fontSize === level
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {fontLabels[level]}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    update({ fontSize: Math.min(2, settings.fontSize + 1) as FontSize })
                  }
                  disabled={settings.fontSize === 2}
                  aria-label="הגדל טקסט"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted disabled:opacity-30"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Toggle options */}
            <div>
              <p className="mb-2.5 text-xs font-semibold text-muted-foreground">
                אפשרויות תצוגה
              </p>
              <div className="grid grid-cols-2 gap-2">
                {toggles.map(({ label, key }) => (
                  <ToggleBtn
                    key={key}
                    label={label}
                    active={settings[key]}
                    onClick={() => update({ [key]: !settings[key] })}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground/60">
            עמוד זה עומד בתקן נגישות ישראלי 5568
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="פתח תפריט נגישות"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "flex size-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95",
          isModified || open
            ? "bg-primary text-primary-foreground shadow-primary/25"
            : "border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-primary",
        )}
      >
        <Accessibility className="size-5" />
      </button>
    </div>
  )
}
