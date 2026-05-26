'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, CheckCircle, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { useApp } from '@/lib/context'
import { ProgressBar } from '@/components/progress-bar'
import { statusLabel, statusColor, formatDate, isOverdue, levelLabel, generateId } from '@/lib/utils'
import type { TaskStatus } from '@/lib/types'

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { currentUser, getTemplate, getTasksForTemplate, getOrgUnit, updateTask, computeProgress, tasks } = useApp()

  const template = getTemplate(id)
  const allTasks = getTasksForTemplate(id)
  const topLevelTasks = allTasks.filter(t => t.parent_task_id === null)

  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [fillTaskId, setFillTaskId] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, unknown>>({})
  const [submitting, setSubmitting] = useState(false)

  if (!template) return <div className="p-8 text-gray-500">Report not found.</div>

  const myTask = allTasks.find(t => t.org_unit_id === currentUser?.org_unit_id)
  const progress = computeProgress(id)

  function startFill(taskId: string) {
    const task = allTasks.find(t => t.id === taskId)
    setFillTaskId(taskId)
    setResponses(task?.responses || {})
  }

  async function handleSubmit() {
    if (!fillTaskId) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 500))
    updateTask(fillTaskId, {
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      responses,
    })
    setFillTaskId(null)
    setSubmitting(false)
  }

  async function handleApprove(taskId: string) {
    updateTask(taskId, { status: 'approved', approved_at: new Date().toISOString() })
  }

  const canApprove = currentUser?.role === 'ceo' || currentUser?.role === 'c_level' || currentUser?.role === 'division_manager'

  // Fill form modal
  if (fillTaskId) {
    const task = allTasks.find(t => t.id === fillTaskId)!
    const unit = getOrgUnit(task.org_unit_id)
    const answered = template.fields.filter(f => responses[f.id] !== undefined && responses[f.id] !== '').length

    return (
      <div className="px-8 py-8 max-w-2xl mx-auto">
        <button onClick={() => setFillTaskId(null)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft size={16} /> Back to report
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="mb-6">
            <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">{template.period}</p>
            <h1 className="text-xl font-bold text-gray-900 mt-1">{template.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Filling for: <strong>{unit?.name}</strong></p>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 mb-6">
            <span>{answered} of {template.fields.length} answered</span>
            <ProgressBar value={Math.round((answered / template.fields.length) * 100)} size="sm" showLabel={false} />
          </div>

          <div className="space-y-6">
            {template.fields.map((field, i) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  {i + 1}. {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.help_text && <p className="text-xs text-gray-400 mb-2">{field.help_text}</p>}

                {field.type === 'text' && (
                  <input
                    value={(responses[field.id] as string) || ''}
                    onChange={e => setResponses(r => ({ ...r, [field.id]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
                {field.type === 'textarea' && (
                  <textarea
                    value={(responses[field.id] as string) || ''}
                    onChange={e => setResponses(r => ({ ...r, [field.id]: e.target.value }))}
                    rows={3}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                )}
                {(field.type === 'number' || field.type === 'percentage') && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={(responses[field.id] as number) ?? ''}
                      onChange={e => setResponses(r => ({ ...r, [field.id]: e.target.valueAsNumber }))}
                      placeholder={field.placeholder || (field.type === 'percentage' ? '0–100' : '0')}
                      min={0}
                      max={field.type === 'percentage' ? 100 : undefined}
                      className="w-40 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {field.type === 'percentage' && <span className="text-gray-500 text-sm">%</span>}
                  </div>
                )}
                {field.type === 'date' && (
                  <input
                    type="date"
                    value={(responses[field.id] as string) || ''}
                    onChange={e => setResponses(r => ({ ...r, [field.id]: e.target.value }))}
                    className="w-48 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
                {field.type === 'select' && (
                  <select
                    value={(responses[field.id] as string) || ''}
                    onChange={e => setResponses(r => ({ ...r, [field.id]: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select an option</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                {field.type === 'checkbox' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!(responses[field.id])}
                      onChange={e => setResponses(r => ({ ...r, [field.id]: e.target.checked }))}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Yes, confirmed</span>
                  </label>
                )}
                {field.type === 'file' && (
                  <input
                    type="file"
                    onChange={e => setResponses(r => ({ ...r, [field.id]: e.target.files?.[0]?.name }))}
                    className="text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => updateTask(fillTaskId, { status: 'in_progress', responses })}
              className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Save Draft
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      <Link href="/reports" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft size={16} /> Back to Reports
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">{template.period}</p>
            <h1 className="text-xl font-bold text-gray-900 mt-1">{template.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{template.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Clock size={12} /> Due {formatDate(template.due_date)}</span>
              <span className="flex items-center gap-1"><Users size={12} /> {template.assigned_levels.map(levelLabel).join(', ')}</span>
            </div>
          </div>
          <div className="w-36 shrink-0 text-right">
            <p className="text-2xl font-bold text-gray-900">{progress}%</p>
            <p className="text-xs text-gray-400 mb-2">overall complete</p>
            <ProgressBar value={progress} size="sm" showLabel={false} />
          </div>
        </div>
      </div>

      {/* My task card */}
      {myTask && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-900">Your task</p>
              <p className="text-xs text-indigo-600 mt-0.5">
                {getOrgUnit(myTask.org_unit_id)?.name} · Due {formatDate(myTask.due_date)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(myTask.status)}`}>
                {statusLabel(myTask.status)}
              </span>
              {(myTask.status === 'not_started' || myTask.status === 'in_progress') && (
                <button
                  onClick={() => startFill(myTask.id)}
                  className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
                >
                  {myTask.status === 'not_started' ? 'Start Filling' : 'Continue'}
                </button>
              )}
              {myTask.status === 'submitted' && (
                <span className="text-xs text-indigo-500 flex items-center gap-1">
                  <CheckCircle size={14} /> Awaiting approval
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All tasks by org unit */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Submission Status by Unit</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {topLevelTasks.map(task => {
            const unit = getOrgUnit(task.org_unit_id)
            const childTasks = allTasks.filter(t => t.parent_task_id === task.id)
            const isExpanded = expandedTask === task.id
            const overdue = task.status !== 'approved' && isOverdue(task.due_date)

            return (
              <div key={task.id}>
                <div
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                >
                  <div className="flex items-center gap-3">
                    {childTasks.length > 0 && (
                      isExpanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-800">{unit?.name}</p>
                      {overdue && <p className="text-xs text-red-500">Overdue · {formatDate(task.due_date)}</p>}
                      {!overdue && <p className="text-xs text-gray-400">Due {formatDate(task.due_date)}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {canApprove && task.status === 'submitted' && (
                      <button
                        onClick={e => { e.stopPropagation(); handleApprove(task.id) }}
                        className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-100"
                      >
                        Approve
                      </button>
                    )}
                    {(task.status === 'not_started' || task.status === 'in_progress') && task.org_unit_id === currentUser?.org_unit_id && (
                      <button
                        onClick={e => { e.stopPropagation(); startFill(task.id) }}
                        className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-100"
                      >
                        Fill
                      </button>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(task.status)}`}>
                      {statusLabel(task.status)}
                    </span>
                  </div>
                </div>

                {isExpanded && childTasks.length > 0 && (
                  <div className="bg-gray-50 border-t border-gray-100 divide-y divide-gray-100">
                    {childTasks.map(child => {
                      const childUnit = getOrgUnit(child.org_unit_id)
                      return (
                        <div key={child.id} className="flex items-center justify-between pl-16 pr-6 py-3">
                          <div>
                            <p className="text-sm text-gray-700">{childUnit?.name}</p>
                            <p className="text-xs text-gray-400">{levelLabel(childUnit?.level || 'sector')}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {canApprove && child.status === 'submitted' && (
                              <button
                                onClick={() => handleApprove(child.id)}
                                className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-100"
                              >
                                Approve
                              </button>
                            )}
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(child.status)}`}>
                              {statusLabel(child.status)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
