import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Salary, SalaryPeriod } from '@/lib/job-board-data'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const PERIOD_LABELS: Record<SalaryPeriod, string> = {
  HOUR: 'לשעה',
  MONTH: 'לחודש',
}

function fmt(n: number): string {
  return n.toLocaleString('he-IL')
}

// Matches a leading bullet ("-", "•", "*", "–", "—", "·") or list number ("1." / "1)").
export const BULLET_RE = /^\s*(?:[-•*–—·]|\d{1,2}[.)])\s+/

/** Removes a leading bullet / list number from a single line. */
export function stripBullet(line: string): string {
  return line.replace(BULLET_RE, '').trim()
}

/** Collapses a multi-line, bulleted description into a single plain-text line (for cards, meta tags). */
export function toPlainSummary(text: string): string {
  return text
    .split('\n')
    .map(stripBullet)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function formatSalary(salary: Salary): string {
  if (salary.type === 'undisclosed') return 'לפי ניסיון'
  const period = PERIOD_LABELS[salary.period]
  if (salary.type === 'minimum') return `מ-${fmt(salary.min)} ₪ ${period}`
  return `${fmt(salary.min)}–${fmt(salary.max)} ₪ ${period}`
}
