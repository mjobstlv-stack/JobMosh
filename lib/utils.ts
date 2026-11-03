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

export function formatSalary(salary: Salary): string {
  if (salary.type === 'undisclosed') return 'לפי ניסיון'
  const period = PERIOD_LABELS[salary.period]
  if (salary.type === 'minimum') return `מ-${fmt(salary.min)} ₪ ${period}`
  return `${fmt(salary.min)}–${fmt(salary.max)} ₪ ${period}`
}
