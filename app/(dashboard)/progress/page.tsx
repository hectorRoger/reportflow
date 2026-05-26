'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Users, CheckCircle2, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { useApp } from '@/lib/context'
import { ProgressBar } from '@/components/progress-bar'
import { statusColor, statusLabel, formatDate, levelLabel, progressColor, isOverdue } from '@/lib/utils'
import type { OrgUnit } from '@/lib/types'

/** Recursive org unit row for the hierarchy tree */
function OrgRow({ unit, templateId, depth = 0 }: { unit: OrgUnit; templateId: string; depth?: number }) {
  const { tasks, getChildUnits, getOrgUnit } = useApp()
  const [open, setOpen] = useState(depth < 1)
  const children = getChildUnits(unit.id)

  const unitTask = tasks.find(t => t.template_id === templateId && t.org_unit_id === unit.id && t.parent_task_id === null)
  const childIds = children.map(c => c.id)
  const grandchildIds = childIds.flatMap(cid => getChildUnits(cid).map(u => u.id))
  const allDescendantIds = [...childIds, ...grandchildIds]
  const descendantTasks = tasks.filter(t =>
    t.template_id === templateId &&
    t.parent_task_id === null &&
    allDescendantIds.includes(t.org_unit_id)
  )
  const allRelevant = unitTask ? [unitTask, ...descendantTasks] : descendantTasks
  const done = allRelevant.filter(t => t.status === 'approved' || t.status === 'submitted').length
  const pct = allRelevant.length > 0 ? Math.round((done / allRelevant.length) * 100) : null

  if (!unitTask && descendantTasks.length === 0 && children.length === 0) return null

  return (
    <div>
      <div
        className="flex items-center gap-3 py-3 rounded-lg hover:bg-gray-50 cursor-pointer group"
        style={{ paddingLeft: `${16 + depth * 20}px`, paddingRight: '16px' }}
        onClick={() => children.length > 0 && setOpen(o => !o)}
      >
        <div className="w-5 shrink-0 flex items-center">
          {children.length > 0 && (
            open
              ? <ChevronDown size={14} className="text-gray-400" />
              : <ChevronRight size={14} className="text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800 truncate">{unit.name}</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">{levelLabel(unit.level)}</span>
          </div>
          {allRelevant.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{done}/{allRelevant.length} submitted</p>
          )}
        </div>
        {unitTask && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor(unitTask.status)}`}>
            {statusLabel(unitTask.status)}
          </span>
        )}
        {pct !== null && (
          <div className="hidden sm:block w-28 shrink-0">
            <ProgressBar value={pct} size="sm" />
          </div>
        )}
        {pct !== null && (
          <span className="sm:hidden text-xs font-semibold text-gray-600 shrink-0">{pct}%</span>
        )}
      </div>
      {open && children.map(child => (
        <OrgRow key={child.id} unit={child} templateId={templateId} depth={depth + 1} />
      ))}
    </div>
  )
}

export default function ProgressPage() {
  const { currentUser, templates, tasks, orgUnits, getScopeOrgUnitIds, computeProgress } = useApp()
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]?.id ?? '')

  const isSupervisor = currentUser?.role === 'ceo' || currentUser?.role === 'c_level'

  const scopeIds = getScopeOrgUnitIds()
  const template = templates.find(t => t.id === selectedTemplate)
  const templateTasks = tasks.filter(t =>
    t.template_id === selectedTemplate &&
    t.parent_task_id === null &&
    (currentUser?.role === 'ceo' ? true : scopeIds.includes(t.org_unit_id))
  )

  const total = templateTasks.length
  const submitted = templateTasks.filter(t => t.status === 'submitted' || t.status === 'approved').length
  const approved = templateTasks.filter(t => t.status === 'approved').length
  const notStarted = templateTasks.filter(t => t.status === 'not_started').length
  const overdue = templateTasks.filter(t => isOverdue(t.due_date) && t.status !== 'approved').length
  const overallPct = computeProgress(selectedTemplate)

  // Top-level org units in scope
  const topUnits = currentUser?.role === 'ceo'
    ? orgUnits.filter(u => u.parent_id === null)
    : orgUnits.filter(u => u.id === currentUser?.org_unit_id)

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Progress Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Track activity completion across your organisation</p>
        </div>
        <Link
          href="/assign"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 sm:px-4 py-2.5 rounded-lg transition-colors shrink-0"
        >
          + <span className="hidden sm:inline">Assign Task</span><span className="sm:hidden">Assign</span>
        </Link>
      </div>

      {/* Activity selector — card grid */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Select Activity</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map(t => {
            const pct = computeProgress(t.id)
            const isSelected = selectedTemplate === t.id
            const tTasks = tasks.filter(tk => tk.template_id === t.id && tk.parent_task_id === null)
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-200'
                }`}
              >
                <p className={`font-semibold text-sm leading-tight mb-1 ${isSelected ? 'text-indigo-800' : 'text-gray-800'}`}>
                  {t.title}
                </p>
                <p className="text-xs text-gray-400 mb-3">{t.period} · Due {formatDate(t.due_date)}</p>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-1.5 rounded-full transition-all ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{pct}% · {tTasks.filter(tk => tk.status === 'submitted' || tk.status === 'approved').length}/{tTasks.length} submitted</p>
              </button>
            )
          })}
        </div>
      </div>

      {template && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6 sm:mb-8">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
              <div>
                <p className="text-4xl font-bold text-gray-900">{overallPct}%</p>
                <p className="text-xs text-gray-500 mt-1">Overall completion</p>
                <div className="mt-2 w-32">
                  <ProgressBar value={overallPct} size="sm" showLabel={false} />
                </div>
              </div>
            </div>
            {[
              { label: 'Total Tasks', value: total, icon: <Users size={18} className="text-gray-400" /> },
              { label: 'Submitted', value: submitted, icon: <TrendingUp size={18} className="text-blue-500" /> },
              { label: 'Approved', value: approved, icon: <CheckCircle2 size={18} className="text-green-500" /> },
              { label: overdue > 0 ? 'Overdue ⚠' : 'Overdue', value: overdue, icon: <Clock size={18} className={overdue > 0 ? 'text-red-500' : 'text-gray-300'} /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">{icon}</div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Status breakdown bar */}
          {isSupervisor && total > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Submission Breakdown</h2>
              <div className="flex h-8 rounded-lg overflow-hidden gap-0.5">
                {[
                  { status: 'approved', color: 'bg-green-500' },
                  { status: 'submitted', color: 'bg-blue-400' },
                  { status: 'in_progress', color: 'bg-amber-400' },
                  { status: 'not_started', color: 'bg-gray-200' },
                  { status: 'rejected', color: 'bg-red-400' },
                ].map(({ status, color }) => {
                  const count = templateTasks.filter(t => t.status === status).length
                  if (count === 0) return null
                  const width = Math.round((count / total) * 100)
                  return (
                    <div
                      key={status}
                      className={`${color} flex items-center justify-center text-xs text-white font-medium transition-all`}
                      style={{ width: `${width}%` }}
                      title={`${statusLabel(status as never)}: ${count}`}
                    >
                      {width >= 10 && count}
                    </div>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                {[
                  { label: 'Approved', color: 'bg-green-500', status: 'approved' },
                  { label: 'Submitted', color: 'bg-blue-400', status: 'submitted' },
                  { label: 'In Progress', color: 'bg-amber-400', status: 'in_progress' },
                  { label: 'Not Started', color: 'bg-gray-200', status: 'not_started' },
                ].map(({ label, color, status }) => {
                  const count = templateTasks.filter(t => t.status === status).length
                  if (count === 0) return null
                  return (
                    <div key={status} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                      {label}: <strong className="text-gray-700">{count}</strong>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Org hierarchy tree */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Organisation Breakdown</h2>
              <p className="text-xs text-gray-400">Due {formatDate(template.due_date)}</p>
            </div>
            <div className="p-2">
              {topUnits.map(unit => (
                <OrgRow key={unit.id} unit={unit} templateId={selectedTemplate} depth={0} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
