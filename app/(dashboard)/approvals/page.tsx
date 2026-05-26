'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, ThumbsUp, ThumbsDown, Clock, User2, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react'
import { useApp } from '@/lib/context'
import { formatDate, progressColor, timeAgo } from '@/lib/utils'
import type { Task } from '@/lib/types'

function SubmissionCard({
  task,
  selected,
  onToggleSelect,
  onApprove,
  onReject,
}: {
  task: Task
  selected: boolean
  onToggleSelect: () => void
  onApprove: (id: string, notes: string) => void
  onReject: (id: string, notes: string) => void
}) {
  const { getUser, getOrgUnit, getTaskDisplayTitle } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState('')
  const [mode, setMode] = useState<'idle' | 'approving' | 'rejecting'>('idle')

  const assignee = task.assigned_to_user_id ? getUser(task.assigned_to_user_id) : null
  const unit = getOrgUnit(task.org_unit_id)

  function confirm(action: 'approve' | 'reject') {
    if (action === 'approve') onApprove(task.id, notes)
    else onReject(task.id, notes)
    setMode('idle')
    setNotes('')
  }

  return (
    <div className={`bg-white rounded-xl border transition-all ${selected ? 'border-indigo-400 ring-1 ring-indigo-300' : 'border-blue-200'}`}>
      {/* Header row */}
      <div className="flex items-start gap-3 px-5 py-4">
        {/* Checkbox */}
        <button
          onClick={onToggleSelect}
          className="mt-0.5 text-gray-400 hover:text-indigo-600 transition-colors shrink-0"
        >
          {selected ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} />}
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
          {assignee
            ? assignee.name.split(' ').map(n => n[0]).join('').slice(0, 2)
            : <User2 size={14} />
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-800">{getTaskDisplayTitle(task)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {assignee?.name ?? unit?.name} · {unit?.name}
          </p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {task.report && (
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-1.5 rounded-full ${progressColor(task.report.progress_pct)}`}
                    style={{ width: `${task.report.progress_pct}%` }} />
                </div>
                <span className="text-xs text-gray-500">{task.report.progress_pct}%</span>
              </div>
            )}
            {task.submitted_at && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={10} /> {timeAgo(task.submitted_at)}
              </span>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0"
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && task.report && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Accomplishments</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {task.report.accomplishments || <em className="text-gray-300">Not filled</em>}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Challenges</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {task.report.challenges || <em className="text-gray-300">None reported</em>}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Next Steps</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {task.report.next_steps || <em className="text-gray-300">Not specified</em>}
              </p>
            </div>
          </div>

          {/* Action area */}
          {mode === 'idle' && (
            <div className="pt-2 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => setMode('approving')}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
              >
                <ThumbsUp size={14} /> Approve
              </button>
              <button
                onClick={() => setMode('rejecting')}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <ThumbsDown size={14} /> Request Changes
              </button>
            </div>
          )}

          {mode !== 'idle' && (
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder={mode === 'approving' ? 'Add a note (optional)…' : 'Describe what changes are needed…'}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
              <div className="flex gap-2">
                {mode === 'approving' ? (
                  <button
                    onClick={() => confirm('approve')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle2 size={14} /> Confirm Approval
                  </button>
                ) : (
                  <button
                    onClick={() => confirm('reject')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                  >
                    <XCircle size={14} /> Send Back
                  </button>
                )}
                <button onClick={() => { setMode('idle'); setNotes('') }} className="px-3 py-2 text-gray-400 text-sm hover:text-gray-600">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ApprovalsPage() {
  const { currentUser, tasks, getDirectReports, updateTask } = useApp()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkNotes, setBulkNotes] = useState('')
  const [bulkMode, setBulkMode] = useState(false)

  const canReview = currentUser?.role !== 'staff'
  if (!canReview) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Access restricted.</div>
  }

  const directReports = getDirectReports()

  // Tasks awaiting review within scope
  const submittedTasks = tasks.filter(t =>
    t.status === 'submitted' &&
    t.parent_task_id === null &&
    (
      directReports.some(u => u.org_unit_id === t.org_unit_id || u.id === t.assigned_to_user_id) ||
      currentUser?.role === 'ceo'
    )
  ).sort((a, b) => {
    // Sort by submitted_at descending
    const aTime = a.submitted_at ? new Date(a.submitted_at).getTime() : 0
    const bTime = b.submitted_at ? new Date(b.submitted_at).getTime() : 0
    return bTime - aTime
  })

  // Recently reviewed
  const reviewedTasks = tasks.filter(t =>
    (t.status === 'approved' || t.status === 'rejected') &&
    t.parent_task_id === null &&
    t.approved_by === currentUser?.id
  ).slice(0, 5)

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

  function selectAll() {
    if (selected.size === submittedTasks.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(submittedTasks.map(t => t.id)))
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

  const allSelected = submittedTasks.length > 0 && selected.size === submittedTasks.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-5 sm:py-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Approvals Inbox</h1>
          <p className="text-gray-500 text-sm mt-1">
            {submittedTasks.length === 0
              ? 'Nothing pending — all caught up!'
              : `${submittedTasks.length} submission${submittedTasks.length !== 1 ? 's' : ''} awaiting your review`}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 space-y-6">

        {/* Bulk action bar */}
        {submittedTasks.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              {allSelected
                ? <CheckSquare size={16} className="text-indigo-600" />
                : <Square size={16} />}
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
            {selected.size > 0 && (
              <>
                <span className="text-xs text-gray-400">{selected.size} selected</span>
                {!bulkMode ? (
                  <button
                    onClick={() => setBulkMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ThumbsUp size={14} /> Approve {selected.size}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={bulkNotes}
                      onChange={e => setBulkNotes(e.target.value)}
                      placeholder="Bulk approval note (optional)…"
                      className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-56"
                    />
                    <button onClick={bulkApprove}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700">
                      Confirm
                    </button>
                    <button onClick={() => { setBulkMode(false); setBulkNotes('') }}
                      className="px-3 py-1.5 text-gray-400 text-sm hover:text-gray-600">
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Pending submissions */}
        {submittedTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-green-500" />
            </div>
            <p className="font-semibold text-gray-700">All caught up!</p>
            <p className="text-sm text-gray-400 mt-1">No submissions pending your review.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submittedTasks.map(task => (
              <SubmissionCard
                key={task.id}
                task={task}
                selected={selected.has(task.id)}
                onToggleSelect={() => toggleSelect(task.id)}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}

        {/* Recently reviewed */}
        {reviewedTasks.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recently Reviewed</h2>
            <div className="space-y-2">
              {reviewedTasks.map(task => (
                <div key={task.id} className={`bg-white rounded-xl border px-5 py-3.5 flex items-center gap-3 ${task.status === 'approved' ? 'border-green-200' : 'border-red-200'}`}>
                  {task.status === 'approved'
                    ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                    : <XCircle size={16} className="text-red-400 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{task.title ?? 'Task'}</p>
                    {task.approved_at && (
                      <p className="text-xs text-gray-400">{timeAgo(task.approved_at)}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${task.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {task.status === 'approved' ? 'Approved' : 'Changes requested'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
