'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp,
  ThumbsUp, ThumbsDown, Plus, LayoutGrid, List,
  CheckSquare, Square,
} from 'lucide-react'
import { useApp } from '@/lib/context'
import { statusColor, statusLabel, formatDate, isOverdue, progressColor } from '@/lib/utils'
import type { User, Task } from '@/lib/types'

function ReportCard({
  user, task, selected, onToggleSelect, onApprove, onReject,
}: {
  user: User
  task: Task
  selected: boolean
  onToggleSelect: () => void
  onApprove: (id: string, notes: string) => void
  onReject: (id: string, notes: string) => void
}) {
  const { getTemplate, getOrgUnit, getTaskDisplayTitle } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState('')
  const [reviewing, setReviewing] = useState(false)

  const template = getTemplate(task.template_id)
  const unit = getOrgUnit(task.org_unit_id)
  const overdue = isOverdue(task.due_date) && task.status !== 'approved'
  const hasReport = !!task.report

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2)
  const isSubmitted = task.status === 'submitted'

  return (
    <div className={`bg-white rounded-xl border transition-all ${
      selected ? 'border-indigo-400 ring-1 ring-indigo-300' :
      task.status === 'approved' ? 'border-green-200' :
      isSubmitted ? 'border-blue-200' :
      overdue ? 'border-red-200' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4">
        {/* Checkbox — only for submitted tasks */}
        {isSubmitted && (
          <button onClick={onToggleSelect} className="text-gray-300 hover:text-indigo-600 shrink-0 transition-colors">
            {selected ? <CheckSquare size={17} className="text-indigo-600" /> : <Square size={17} />}
          </button>
        )}

        <div
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={() => hasReport && setExpanded(e => !e)}
        >
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{unit?.name} · {getTaskDisplayTitle(task)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={() => hasReport && setExpanded(e => !e)}>
          {task.report && task.status !== 'approved' && (
            <div className="hidden sm:flex items-center gap-1.5 w-20">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${progressColor(task.report.progress_pct)}`}
                  style={{ width: `${task.report.progress_pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-7 text-right">{task.report.progress_pct}%</span>
            </div>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer ${statusColor(task.status)}`}>
            {statusLabel(task.status)}
          </span>
          {overdue && task.status === 'not_started' && (
            <AlertCircle size={15} className="text-red-400" />
          )}
          {hasReport && (
            expanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Due date */}
      <div className={`px-4 pb-3 flex items-center gap-1.5 text-xs ${overdue && task.status !== 'approved' ? 'text-red-500' : 'text-gray-400'}`}>
        <Clock size={11} />
        {overdue && task.status !== 'approved' ? 'Overdue · ' : 'Due '}
        {formatDate(task.due_date)}
        {task.submitted_at && <span className="ml-2 text-gray-400">· Submitted {formatDate(task.submitted_at)}</span>}
      </div>

      {/* Expanded report */}
      {expanded && task.report && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          {task.instructions && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
              <p className="text-xs font-semibold text-indigo-600 mb-1">Your instructions</p>
              <p className="text-sm text-indigo-800">{task.instructions}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Accomplishments</p>
              <p className="text-sm text-gray-700 leading-relaxed">{task.report.accomplishments || <span className="text-gray-300 italic">Not filled</span>}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-2 rounded-full ${progressColor(task.report.progress_pct)}`} style={{ width: `${task.report.progress_pct}%` }} />
                </div>
                <span className="text-sm font-bold text-gray-700">{task.report.progress_pct}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Challenges</p>
              <p className="text-sm text-gray-700 leading-relaxed">{task.report.challenges || <span className="text-gray-300 italic">None reported</span>}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Next Steps</p>
              <p className="text-sm text-gray-700 leading-relaxed">{task.report.next_steps || <span className="text-gray-300 italic">Not specified</span>}</p>
            </div>
          </div>

          {task.status === 'submitted' && !reviewing && (
            <div className="pt-3 border-t border-gray-100 flex gap-2">
              <button onClick={() => setReviewing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
                <ThumbsUp size={14} /> Approve
              </button>
              <button onClick={() => setReviewing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                <ThumbsDown size={14} /> Request Changes
              </button>
            </div>
          )}

          {task.status === 'submitted' && reviewing && (
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Add feedback or notes (optional)…"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => onApprove(task.id, notes)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">
                  <ThumbsUp size={14} /> Approve
                </button>
                <button onClick={() => onReject(task.id, notes)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                  <ThumbsDown size={14} /> Request Changes
                </button>
                <button onClick={() => setReviewing(false)} className="px-3 py-2 text-gray-400 text-sm hover:text-gray-600">Cancel</button>
              </div>
            </div>
          )}

          {task.status === 'approved' && (
            <div className="pt-3 border-t border-green-100 flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle2 size={16} /> Approved
              {task.reviewer_notes && <span className="text-gray-400 ml-2">· &ldquo;{task.reviewer_notes}&rdquo;</span>}
            </div>
          )}

          {task.status === 'rejected' && task.reviewer_notes && (
            <div className="pt-3 border-t border-red-100 bg-red-50 rounded-lg px-4 py-3">
              <p className="text-xs font-semibold text-red-500 mb-1">Changes Requested</p>
              <p className="text-sm text-red-700">{task.reviewer_notes}</p>
            </div>
          )}
        </div>
      )}

      {!hasReport && task.status === 'not_started' && (
        <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400 italic">
          No report submitted yet.
        </div>
      )}
    </div>
  )
}

/** Kanban column */
function KanbanColumn({ title, color, tasks, users, onApprove, onReject }: {
  title: string
  color: string
  tasks: Task[]
  users: User[]
  onApprove: (id: string, notes: string) => void
  onReject: (id: string, notes: string) => void
}) {
  const { getTaskDisplayTitle, getOrgUnit } = useApp()
  return (
    <div className="flex-1 min-w-[220px]">
      <div className={`text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 ${color}`}>
        {title}
        <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 py-6 text-center text-xs text-gray-300">
            Empty
          </div>
        )}
        {tasks.map(task => {
          const user = users.find(u => u.org_unit_id === task.org_unit_id || u.id === task.assigned_to_user_id)
          const unit = getOrgUnit(task.org_unit_id)
          const overdue = isOverdue(task.due_date) && task.status !== 'approved'
          return (
            <div key={task.id} className={`bg-white rounded-xl border p-3.5 ${
              task.status === 'submitted' ? 'border-blue-200' :
              task.status === 'approved' ? 'border-green-200' :
              overdue ? 'border-red-200' : 'border-gray-200'
            }`}>
              <p className="font-medium text-sm text-gray-800 leading-tight">{getTaskDisplayTitle(task)}</p>
              <p className="text-xs text-gray-400 mt-1">{user?.name ?? unit?.name}</p>
              {task.report && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-1 rounded-full ${progressColor(task.report.progress_pct)}`}
                      style={{ width: `${task.report.progress_pct}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400">{task.report.progress_pct}%</span>
                </div>
              )}
              {overdue && (
                <p className="text-[10px] text-red-500 mt-1.5 flex items-center gap-0.5">
                  <AlertCircle size={9} /> Overdue
                </p>
              )}
              {task.status === 'submitted' && (
                <div className="flex gap-1.5 mt-2">
                  <button onClick={() => onApprove(task.id, '')}
                    className="flex-1 py-1 bg-green-50 text-green-700 text-xs font-medium rounded hover:bg-green-100 transition-colors">
                    ✓ Approve
                  </button>
                  <button onClick={() => onReject(task.id, 'Changes requested.')}
                    className="flex-1 py-1 bg-red-50 text-red-600 text-xs font-medium rounded hover:bg-red-100 transition-colors">
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TeamPage() {
  const router = useRouter()
  const { currentUser, getTasksForUser, getDirectReports, updateTask } = useApp()
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'approved'>('all')
  const [view, setView] = useState<'list' | 'board'>('list')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkNotes, setBulkNotes] = useState('')
  const [bulkMode, setBulkMode] = useState(false)

  const canViewTeam = currentUser?.role === 'division_manager' ||
    currentUser?.role === 'c_level' ||
    currentUser?.role === 'ceo'

  if (!canViewTeam) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Access restricted.</div>
  }

  const directReports = getDirectReports()
  const allTasks = getTasksForUser().filter(t => t.parent_task_id === null)

  const teamTasks = allTasks.filter(t =>
    directReports.some(u => u.org_unit_id === t.org_unit_id || u.id === t.assigned_to_user_id)
  )

  const filtered = filter === 'all' ? teamTasks :
    filter === 'pending' ? teamTasks.filter(t => t.status === 'not_started' || t.status === 'in_progress') :
    filter === 'submitted' ? teamTasks.filter(t => t.status === 'submitted') :
    teamTasks.filter(t => t.status === 'approved')

  const pendingReview = teamTasks.filter(t => t.status === 'submitted').length
  const approved = teamTasks.filter(t => t.status === 'approved').length
  const notStarted = teamTasks.filter(t => t.status === 'not_started').length

  function getUserForTask(task: Task): User | undefined {
    return directReports.find(u =>
      u.id === task.assigned_to_user_id || u.org_unit_id === task.org_unit_id
    )
  }

  function handleApprove(taskId: string, notes: string) {
    updateTask(taskId, {
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: currentUser!.id,
      reviewer_notes: notes || undefined,
    })
    setSelected(s => { const n = new Set(s); n.delete(taskId); return n })
  }

  function handleReject(taskId: string, notes: string) {
    updateTask(taskId, {
      status: 'rejected',
      reviewer_notes: notes || 'Changes requested.',
    })
    setSelected(s => { const n = new Set(s); n.delete(taskId); return n })
  }

  function toggleSelect(id: string) {
    setSelected(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const submittedIds = filtered.filter(t => t.status === 'submitted').map(t => t.id)
  const allSelected = submittedIds.length > 0 && submittedIds.every(id => selected.has(id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(s => { const n = new Set(s); submittedIds.forEach(id => n.delete(id)); return n })
    } else {
      setSelected(s => { const n = new Set(s); submittedIds.forEach(id => n.add(id)); return n })
    }
  }

  function bulkApprove() {
    selected.forEach(id => {
      updateTask(id, {
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: currentUser!.id,
        reviewer_notes: bulkNotes || undefined,
      })
    })
    setSelected(new Set())
    setBulkMode(false)
    setBulkNotes('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-5 sm:py-6">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Team Reports</h1>
            <p className="text-gray-500 text-sm mt-1">
              {directReports.length} direct report{directReports.length !== 1 ? 's' : ''} · {teamTasks.length} tasks
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setView('list')}
                className={`p-2 ${view === 'list' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setView('board')}
                className={`p-2 ${view === 'board' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            <button
              onClick={() => router.push('/assign')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 sm:px-4 py-2.5 rounded-lg transition-colors shrink-0"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Assign Task</span><span className="sm:hidden">Assign</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-5xl mx-auto mt-4 sm:mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{notStarted}</p>
            <p className="text-xs text-amber-600 mt-0.5">Not Started</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{pendingReview}</p>
            <p className="text-xs text-blue-600 mt-0.5">Awaiting Review</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{approved}</p>
            <p className="text-xs text-green-600 mt-0.5">Approved</p>
          </div>
        </div>
      </div>

      {/* Board view */}
      {view === 'board' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex gap-4 overflow-x-auto pb-4">
            <KanbanColumn
              title="Not Started"
              color="text-amber-600"
              tasks={teamTasks.filter(t => t.status === 'not_started')}
              users={directReports}
              onApprove={handleApprove}
              onReject={handleReject}
            />
            <KanbanColumn
              title="In Progress"
              color="text-blue-600"
              tasks={teamTasks.filter(t => t.status === 'in_progress')}
              users={directReports}
              onApprove={handleApprove}
              onReject={handleReject}
            />
            <KanbanColumn
              title="For Review"
              color="text-violet-600"
              tasks={teamTasks.filter(t => t.status === 'submitted')}
              users={directReports}
              onApprove={handleApprove}
              onReject={handleReject}
            />
            <KanbanColumn
              title="Approved"
              color="text-green-600"
              tasks={teamTasks.filter(t => t.status === 'approved')}
              users={directReports}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">
          {/* Filter + Bulk bar */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <div className="flex gap-2 flex-wrap flex-1">
              {[
                { key: 'all', label: `All (${teamTasks.length})` },
                { key: 'pending', label: `Pending (${notStarted})` },
                { key: 'submitted', label: `For Review (${pendingReview})` },
                { key: 'approved', label: `Approved (${approved})` },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as typeof filter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    filter === key
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Bulk select controls */}
            {submittedIds.length > 0 && (
              <button onClick={toggleSelectAll} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                {allSelected ? <CheckSquare size={15} className="text-indigo-600" /> : <Square size={15} />}
                {allSelected ? 'Deselect' : 'Select all'}
              </button>
            )}
          </div>

          {/* Bulk approve bar */}
          {selected.size > 0 && (
            <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
              <span className="text-sm text-indigo-700 font-medium">{selected.size} selected</span>
              {!bulkMode ? (
                <button
                  onClick={() => setBulkMode(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700"
                >
                  <ThumbsUp size={13} /> Approve {selected.size}
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    value={bulkNotes}
                    onChange={e => setBulkNotes(e.target.value)}
                    placeholder="Note (optional)…"
                    className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-44"
                  />
                  <button onClick={bulkApprove}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700">
                    Confirm
                  </button>
                  <button onClick={() => { setBulkMode(false); setBulkNotes('') }}
                    className="px-2 py-1.5 text-gray-400 text-sm hover:text-gray-600">
                    Cancel
                  </button>
                </div>
              )}
              <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-gray-400 hover:text-gray-600">
                Clear
              </button>
            </div>
          )}

          {/* Task cards */}
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p>No tasks in this category.</p>
              </div>
            )}
            {filtered.map(task => {
              const user = getUserForTask(task)
              if (!user) return null
              return (
                <ReportCard
                  key={task.id}
                  user={user}
                  task={task}
                  selected={selected.has(task.id)}
                  onToggleSelect={() => toggleSelect(task.id)}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
