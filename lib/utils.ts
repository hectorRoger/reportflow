import type { TaskStatus, ReportStatus, OrgLevel, UserRole, ReportFrequency } from './types'

export function statusLabel(s: TaskStatus): string {
  return {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected',
  }[s]
}

export function statusColor(s: TaskStatus): string {
  return {
    not_started: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-amber-100 text-amber-700',
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }[s]
}

export function reportStatusColor(s: ReportStatus): string {
  return {
    draft: 'bg-gray-100 text-gray-600',
    active: 'bg-green-100 text-green-700',
    closed: 'bg-slate-100 text-slate-600',
  }[s]
}

export function levelLabel(l: OrgLevel): string {
  return {
    organization: 'Organisation',
    directorate: 'Directorate',
    division: 'Division',
    unit: 'Unit',
  }[l]
}

export function roleLabel(r: UserRole): string {
  return {
    ceo: 'CEO',
    c_level: 'C-Level Executive',
    division_manager: 'Division Manager',
    staff: 'Staff',
  }[r]
}

export function roleBadgeColor(r: UserRole): string {
  return {
    ceo: 'bg-purple-100 text-purple-700',
    c_level: 'bg-indigo-100 text-indigo-700',
    division_manager: 'bg-blue-100 text-blue-700',
    staff: 'bg-gray-100 text-gray-600',
  }[r]
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function isOverdue(due: string): boolean {
  return new Date(due) < new Date()
}

export function progressColor(pct: number): string {
  if (pct >= 80) return 'bg-green-500'
  if (pct >= 40) return 'bg-amber-400'
  return 'bg-red-400'
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}

export function getISOWeek(date = new Date()): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const wn = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(wn).padStart(2, '0')}`
}

export function weekLabel(date = new Date()): string {
  const monday = new Date(date)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const friday = new Date(monday)
  friday.setDate(friday.getDate() + 4)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${monday.toLocaleDateString('en-GB', opts)} – ${friday.toLocaleDateString('en-GB', opts)}`
}

export function frequencyLabel(f: ReportFrequency): string {
  return { weekly: 'Weekly', biweekly: 'Bi-Weekly', monthly: 'Monthly', quarterly: 'Quarterly' }[f]
}

export function frequencyBadgeColor(f: ReportFrequency): string {
  return {
    weekly:    'bg-violet-100 text-violet-700',
    biweekly:  'bg-sky-100 text-sky-700',
    monthly:   'bg-amber-100 text-amber-700',
    quarterly: 'bg-teal-100 text-teal-700',
  }[f]
}
