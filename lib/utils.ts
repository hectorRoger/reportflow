import type { TaskStatus, ReportStatus, OrgLevel, UserRole } from './types'

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
