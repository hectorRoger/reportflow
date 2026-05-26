'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, CheckCircle2, ChevronRight, Paperclip, AlertCircle, Lock } from 'lucide-react'
import { useApp } from '@/lib/context'
import { formatDate, isOverdue, frequencyLabel, frequencyBadgeColor } from '@/lib/utils'
import type { TaskReport } from '@/lib/types'

export default function TaskReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { currentUser, tasks, getTemplate, getOrgUnit, updateTask, getTasksForUser, isTaskBlocked, getBlockingTasks, getTaskDisplayTitle } = useApp()

  const task = tasks.find(t => t.id === id)
  const template = task ? getTemplate(task.template_id) : null
  const unit = task ? getOrgUnit(task.org_unit_id) : null
  const isAdhoc = !template || task?.template_id === 'adhoc'
  const taskTitle = task ? getTaskDisplayTitle(task) : ''

  // All pending tasks for "X of Y" and next-task navigation
  const myTasks = getTasksForUser().filter(t => t.parent_task_id === null)
  const taskIndex = myTasks.findIndex(t => t.id === id)
  const nextTask = myTasks.find((t, i) =>
    i > taskIndex && (t.status === 'not_started' || t.status === 'in_progress')
  )

  const [report, setReport] = useState<TaskReport>({
    accomplishments: task?.report?.accomplishments ?? '',
    progress_pct: task?.report?.progress_pct ?? 0,
    challenges: task?.report?.challenges ?? '',
    next_steps: task?.report?.next_steps ?? '',
    attachment_name: task?.report?.attachment_name,
  })
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!task) {
    return <div className="p-8 text-gray-400">Task not found.</div>
  }

  const isReadOnly = task.status === 'submitted' || task.status === 'approved'
  const overdue = isOverdue(task.due_date) && !isReadOnly
  const blocked = !isReadOnly && task.status === 'not_started' && isTaskBlocked(task.id)
  const blockingTasks = blocked ? getBlockingTasks(task.id) : []

  function set(field: keyof TaskReport, value: string | number) {
    setReport(r => ({ ...r, [field]: value }))
  }

  async function handleSaveDraft() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 300))
    if (report.progress_pct === 100) {
      // Auto-submit when task is complete
      if (!report.accomplishments.trim()) {
        setSaving(false)
        alert('Please describe what you accomplished before submitting.')
        return
      }
      updateTask(task!.id, { status: 'submitted', submitted_at: new Date().toISOString(), report })
      setSaving(false)
      setSubmitted(true)
    } else {
      updateTask(task!.id, { status: 'in_progress', report })
      setSaving(false)
    }
  }

  async function handleSubmit() {
    if (!report.accomplishments.trim()) {
      alert('Please describe what you accomplished before submitting.')
      return
    }
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    updateTask(task!.id, {
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      report,
    })
    setSaving(false)
    setSubmitted(true)
  }

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Report Submitted!</h2>
          <p className="text-gray-500 text-sm mb-8">
            Your report for <strong>{taskTitle}</strong> has been submitted and is awaiting review.
          </p>

          {nextTask ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 text-left">
              <p className="text-xs text-gray-400 mb-1">Next task</p>
              <p className="font-semibold text-gray-800">{getTaskDisplayTitle(nextTask)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Due {formatDate(nextTask.due_date)}</p>
              <button
                onClick={() => router.push(`/tasks/${nextTask.id}`)}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                Continue to Next Task <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-4">
              <p className="text-green-700 font-semibold">All tasks reported!</p>
              <p className="text-green-600 text-sm mt-1">You have no more pending tasks.</p>
            </div>
          )}

          <button
            onClick={() => router.push('/tasks')}
            className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
          >
            Back to task list
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/tasks')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ChevronLeft size={16} /> My Tasks
        </button>
        {myTasks.length > 1 && (
          <span className="text-xs text-gray-400">
            Task {taskIndex + 1} of {myTasks.length}
          </span>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Manager instructions banner */}
        {task.instructions && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 mb-5">
            <p className="text-xs font-semibold text-indigo-600 mb-1">Instructions from your manager</p>
            <p className="text-sm text-indigo-800">{task.instructions}</p>
          </div>
        )}

        {/* Rejection notes banner */}
        {task.status === 'rejected' && task.reviewer_notes && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-5">
            <p className="text-xs font-semibold text-red-600 mb-1">Changes requested by your manager</p>
            <p className="text-sm text-red-700">{task.reviewer_notes}</p>
          </div>
        )}

        {/* Blocked banner */}
        {blocked && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-5 flex items-start gap-3">
            <Lock size={15} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-1">This task is blocked</p>
              <p className="text-sm text-amber-800">
                Waiting for approval of:{' '}
                {blockingTasks.map(t => getTaskDisplayTitle(t)).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Task header */}
        <div className="mb-8">
          {overdue && (
            <div className="flex items-center gap-2 text-red-600 text-xs font-medium mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={14} /> This task is overdue — please submit as soon as possible
            </div>
          )}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {!isAdhoc && template?.period && (
                  <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">{template.period}</p>
                )}
                {!isAdhoc && template?.frequency && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${frequencyBadgeColor(template.frequency)}`}>
                    {frequencyLabel(template.frequency)}
                  </span>
                )}
                {isAdhoc && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">Task</span>
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900">{taskTitle}</h1>
              {task.description && (
                <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {unit?.name} · Due {formatDate(task.due_date)}
              </p>
            </div>
            {isReadOnly && (
              <span className="text-xs bg-green-100 text-green-700 font-medium px-3 py-1.5 rounded-full shrink-0">
                {task.status === 'approved' ? 'Approved ✓' : 'Submitted'}
              </span>
            )}
          </div>
        </div>

        {/* Report form */}
        <div className="space-y-5">

          {/* 1. Accomplishments */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block font-semibold text-gray-900 mb-1">
              1. What did you accomplish on this task?
              {!isReadOnly && <span className="text-red-500 ml-1">*</span>}
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Describe the activities completed, outputs delivered, and any milestones reached.
            </p>
            <textarea
              value={report.accomplishments}
              onChange={e => set('accomplishments', e.target.value)}
              disabled={isReadOnly}
              rows={4}
              placeholder="e.g. Completed connectivity survey in 4 cells. Installed fiber in 3 schools. Held coordination meeting with district ICT team..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* 2. Progress */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block font-semibold text-gray-900 mb-1">
              2. Overall progress on this task
            </label>
            <p className="text-xs text-gray-400 mb-4">
              Estimate how complete this task is overall.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={report.progress_pct}
                onChange={e => set('progress_pct', Number(e.target.value))}
                disabled={isReadOnly}
                className="flex-1 h-2 accent-indigo-600 disabled:opacity-50"
              />
              <div className="w-16 text-center">
                <span className={`text-2xl font-bold ${
                  report.progress_pct >= 80 ? 'text-green-600' :
                  report.progress_pct >= 40 ? 'text-amber-500' : 'text-red-500'
                }`}>{report.progress_pct}%</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-300 mt-1 px-0.5">
              <span>Not started</span>
              <span>Halfway</span>
              <span>Complete</span>
            </div>
            {report.progress_pct === 100 && !isReadOnly && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 size={15} className="text-green-500 shrink-0" />
                Task complete — this will be submitted automatically when you save.
              </div>
            )}
          </div>

          {/* 3. Challenges */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block font-semibold text-gray-900 mb-1">
              3. Challenges encountered
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Any blockers, delays, or issues that affected progress. Leave blank if none.
            </p>
            <textarea
              value={report.challenges}
              onChange={e => set('challenges', e.target.value)}
              disabled={isReadOnly}
              rows={3}
              placeholder="e.g. Power outages delayed installation in 2 sites. Pending approval from district office..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* 4. Next steps */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block font-semibold text-gray-900 mb-1">
              4. Next steps planned
            </label>
            <p className="text-xs text-gray-400 mb-3">
              What will you do next to advance or complete this task?
            </p>
            <textarea
              value={report.next_steps}
              onChange={e => set('next_steps', e.target.value)}
              disabled={isReadOnly}
              rows={3}
              placeholder="e.g. Survey remaining 2 cells by Friday. Follow up with RURA on power supply issue..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* 5. Attachment */}
          {!isReadOnly && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <label className="block font-semibold text-gray-900 mb-1">
                5. Supporting document <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Attach photos, spreadsheets, or any evidence of work done.
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                  <Paperclip size={15} className="text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {report.attachment_name || 'Click to attach a file'}
                  </span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={e => {
                    const name = e.target.files?.[0]?.name
                    if (name) set('attachment_name', name)
                  }}
                />
              </label>
            </div>
          )}

          {/* Read-only: show attachment */}
          {isReadOnly && report.attachment_name && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-3">
              <Paperclip size={15} className="text-gray-400" />
              <span className="text-sm text-gray-600">{report.attachment_name}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!isReadOnly && !blocked && (
          <div className="mt-8 flex gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex-1 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
            >
              {saving ? 'Submitting…' : 'Submit Report →'}
            </button>
          </div>
        )}

        {isReadOnly && (
          <div className="mt-8">
            <button
              onClick={() => router.push('/tasks')}
              className="w-full py-3 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50"
            >
              ← Back to task list
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
