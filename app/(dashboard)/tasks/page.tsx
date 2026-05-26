'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronRight, PlayCircle, Lock } from 'lucide-react'
import { useApp } from '@/lib/context'
import { statusColor, formatDate, isOverdue } from '@/lib/utils'
import type { Task } from '@/lib/types'

function TaskStatusIcon({ task }: { task: Task }) {
  if (task.status === 'approved') return <CheckCircle2 size={22} className="text-green-500 shrink-0" />
  if (task.status === 'submitted') return <CheckCircle2 size={22} className="text-blue-400 shrink-0" />
  if (task.status === 'in_progress') return <PlayCircle size={22} className="text-amber-400 shrink-0" />
  return <Circle size={22} className="text-gray-300 shrink-0" />
}

export default function TasksPage() {
  const router = useRouter()
  const { currentUser, getTasksForUser, getTemplate, getOrgUnit, isTaskBlocked, getTaskDisplayTitle } = useApp()
  const isReporter = currentUser?.role === 'staff'

  const allTasks = getTasksForUser().filter(t => t.parent_task_id === null)
  const pending = allTasks.filter(t => t.status === 'not_started' || t.status === 'in_progress')
  const done = allTasks.filter(t => t.status === 'submitted' || t.status === 'approved')
  // Skip blocked tasks for the "Next Up" CTA so we surface actionable work first
  const firstPending = pending.find(t => !isTaskBlocked(t.id))

  // Reporter-focused queue view
  if (isReporter) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-5 sm:py-6">
          <div className="max-w-2xl mx-auto">
            <p className="text-sm text-indigo-600 font-medium mb-1">
              Welcome back, {currentUser?.name.split(' ')[0]}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Your Reporting Tasks</h1>
            <p className="text-gray-500 text-sm mt-1">
              {pending.length === 0
                ? 'All tasks reported — great work!'
                : `${pending.length} task${pending.length > 1 ? 's' : ''} waiting for your report`}
            </p>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{done.length} of {allTasks.length} submitted</span>
                <span>{allTasks.length > 0 ? Math.round((done.length / allTasks.length) * 100) : 0}% complete</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${allTasks.length > 0 ? (done.length / allTasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Start next task CTA */}
          {firstPending && (
            <div className="bg-indigo-600 rounded-2xl p-5 text-white">
              <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Next up</p>
              <p className="font-semibold text-lg leading-tight">{getTaskDisplayTitle(firstPending)}</p>
              <p className="text-indigo-200 text-sm mt-1">
                {getTemplate(firstPending.template_id)?.period ?? 'Task'} · Due {formatDate(firstPending.due_date)}
              </p>
              <button
                onClick={() => router.push(`/tasks/${firstPending.id}`)}
                className="mt-4 bg-white text-indigo-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                {firstPending.status === 'in_progress' ? 'Continue →' : 'Start →'}
              </button>
            </div>
          )}

          {/* All tasks */}
          {allTasks.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">All Tasks</h2>
              <div className="space-y-2">
                {allTasks.map((task, i) => {
                  const template = getTemplate(task.template_id)
                  const overdue = (task.status === 'not_started' || task.status === 'in_progress') && isOverdue(task.due_date)
                  const isDone = task.status === 'submitted' || task.status === 'approved'
                  const isRejected = task.status === 'rejected'
                  const taskBlocked = isTaskBlocked(task.id)

                  return (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className={`flex items-center gap-4 bg-white rounded-xl px-5 py-4 border transition-all group ${
                        isDone
                          ? 'border-gray-100 opacity-70'
                          : isRejected
                          ? 'border-red-200 bg-red-50'
                          : taskBlocked
                          ? 'border-amber-200 bg-amber-50/30'
                          : overdue
                          ? 'border-red-200 hover:border-red-300'
                          : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                      }`}
                    >
                      <TaskStatusIcon task={task} />

                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                          {getTaskDisplayTitle(task)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{template?.period}</span>
                          {taskBlocked && (
                            <span className="flex items-center gap-0.5 text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                              <Lock size={10} /> Blocked
                            </span>
                          )}
                          {!taskBlocked && overdue && (
                            <span className="flex items-center gap-0.5 text-xs text-red-500">
                              <AlertCircle size={11} /> Overdue
                            </span>
                          )}
                          {!taskBlocked && !overdue && !isDone && (
                            <span className="flex items-center gap-0.5 text-xs text-gray-400">
                              <Clock size={11} /> Due {formatDate(task.due_date)}
                            </span>
                          )}
                          {!taskBlocked && task.report && !isDone && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              {task.report.progress_pct}% progress saved
                            </span>
                          )}
                        </div>
                      </div>

                      {isDone ? (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${statusColor(task.status)}`}>
                          {task.status === 'approved' ? 'Approved ✓' : 'Submitted'}
                        </span>
                      ) : (
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 shrink-0" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {allTasks.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Circle size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No tasks assigned yet</p>
              <p className="text-sm mt-1">Check back later or contact your administrator</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Manager / Admin table view (unchanged behaviour)
  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-5xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tasks Overview</h1>
        <p className="text-gray-500 text-sm mt-1">All reporting tasks within your scope</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left px-6 py-3 font-medium">Report</th>
              <th className="text-left px-4 py-3 font-medium">Unit</th>
              <th className="text-left px-4 py-3 font-medium">Due</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allTasks.map(task => {
              const template = getTemplate(task.template_id)
              const taskBlocked = isTaskBlocked(task.id)
              return (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{getTaskDisplayTitle(task)}</p>
                    <p className="text-xs text-gray-400">{template?.period ?? 'Ad-hoc task'}</p>
                  </td>
                  <td className="px-4 py-4 text-gray-600 text-xs">{getOrgUnit(task.org_unit_id)?.name ?? task.org_unit_id}</td>
                  <td className="px-4 py-4 text-xs text-gray-500">{formatDate(task.due_date)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {taskBlocked && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Lock size={9} /> Blocked
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link href={`/tasks/${task.id}`} className="text-xs text-indigo-600 hover:underline">View →</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
