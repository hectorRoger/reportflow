'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, AlertCircle, Clock, ArrowRight, PlayCircle,
  TrendingUp, Users, ClipboardList, Bell,
} from 'lucide-react'
import { useApp } from '@/lib/context'
import { ProgressBar } from '@/components/progress-bar'
import { formatDate, isOverdue, timeAgo, weekLabel } from '@/lib/utils'
import type { ActivityEntry } from '@/lib/types'

function activityIcon(type: ActivityEntry['type']) {
  switch (type) {
    case 'task_submitted':   return <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center"><ClipboardList size={13} className="text-blue-600" /></div>
    case 'task_approved':    return <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle2 size={13} className="text-green-600" /></div>
    case 'task_rejected':    return <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center"><AlertCircle size={13} className="text-red-500" /></div>
    case 'task_created':     return <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center"><PlayCircle size={13} className="text-indigo-600" /></div>
    case 'task_assigned':    return <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center"><Users size={13} className="text-violet-600" /></div>
    case 'comment_added':    return <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center"><Bell size={13} className="text-amber-600" /></div>
    default:                 return <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><Clock size={13} className="text-gray-400" /></div>
  }
}

function activityText(entry: ActivityEntry, actorName: string, taskTitle: string) {
  switch (entry.type) {
    case 'task_submitted':  return <><strong>{actorName}</strong> submitted <em>{taskTitle}</em></>
    case 'task_approved':   return <><strong>{actorName}</strong> approved <em>{taskTitle}</em></>
    case 'task_rejected':   return <><strong>{actorName}</strong> requested changes on <em>{taskTitle}</em></>
    case 'task_created':    return <><strong>{actorName}</strong> created <em>{taskTitle}</em></>
    case 'task_assigned':   return <><strong>{actorName}</strong> assigned <em>{taskTitle}</em></>
    case 'comment_added':   return <><strong>{actorName}</strong> commented on <em>{taskTitle}</em></>
    default:                return <><strong>{actorName}</strong> updated <em>{taskTitle}</em></>
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const {
    currentUser, templates, tasks, getTasksForUser, computeProgress,
    getUser, getTaskDisplayTitle, getRecentActivity, isTaskBlocked,
  } = useApp()

  const role = currentUser?.role
  const myTasks = getTasksForUser().filter(t => t.parent_task_id === null)
  const overdueTasks = myTasks.filter(t => !['approved', 'submitted'].includes(t.status) && isOverdue(t.due_date))
  const pendingTasks = myTasks.filter(t => t.status === 'not_started' || t.status === 'in_progress')
  const submittedTasks = myTasks.filter(t => t.status === 'submitted')
  const approvedTasks = myTasks.filter(t => t.status === 'approved')
  const firstPending = pendingTasks.find(t => !isTaskBlocked(t.id))

  const activeTemplates = templates.filter(t => t.status === 'active')
  const recentActivity = getRecentActivity(10)

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-5 sm:py-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm text-indigo-600 font-medium">{greeting}, {currentUser?.name} 👋</p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">Dashboard</h1>
          <p className="text-gray-500 text-xs mt-1">{weekLabel()} · RISA ReportFlow</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 space-y-6">

        {/* Overdue alert banner */}
        {overdueTasks.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 text-sm">
                {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-red-600 mt-0.5">
                {overdueTasks.slice(0, 2).map(t => getTaskDisplayTitle(t)).join(', ')}
                {overdueTasks.length > 2 && ` and ${overdueTasks.length - 2} more`}
              </p>
            </div>
            <Link href="/tasks" className="ml-auto shrink-0 text-xs font-medium text-red-600 hover:text-red-800 whitespace-nowrap">
              View →
            </Link>
          </div>
        )}

        {/* Staff: "Next Up" CTA */}
        {role === 'staff' && firstPending && (
          <div className="bg-indigo-600 rounded-2xl p-5 text-white">
            <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Next up</p>
            <p className="font-bold text-lg leading-tight">{getTaskDisplayTitle(firstPending)}</p>
            <p className="text-indigo-200 text-sm mt-1">Due {formatDate(firstPending.due_date)}</p>
            <button
              onClick={() => router.push(`/tasks/${firstPending.id}`)}
              className="mt-4 bg-white text-indigo-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              {firstPending.status === 'in_progress' ? 'Continue →' : 'Start →'}
            </button>
          </div>
        )}

        {/* Manager / CEO: Approvals CTA */}
        {role !== 'staff' && submittedTasks.length > 0 && (
          <div className="bg-blue-600 rounded-2xl p-5 text-white">
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wide mb-1">Needs your review</p>
            <p className="font-bold text-2xl">{submittedTasks.length}</p>
            <p className="text-blue-200 text-sm mt-0.5">submission{submittedTasks.length !== 1 ? 's' : ''} waiting for approval</p>
            <button
              onClick={() => router.push('/approvals')}
              className="mt-4 bg-white text-blue-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Open Inbox →
            </button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Pending</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-blue-600">{submittedTasks.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">For Review</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-green-600">{approvedTasks.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Approved</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className={`text-2xl font-bold ${overdueTasks.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {overdueTasks.length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Overdue</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Active reports */}
          {activeTemplates.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-500" />
                  Active Reports
                </h2>
                <Link href="/reports" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              <div className="space-y-4">
                {activeTemplates.map(template => {
                  const pct = computeProgress(template.id)
                  return (
                    <Link key={template.id} href={`/reports/${template.id}`} className="block group">
                      <div className="flex items-start justify-between mb-1.5">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 transition-colors leading-tight">
                          {template.title}
                        </p>
                        <span className="text-xs text-gray-400 ml-2 shrink-0">{pct}%</span>
                      </div>
                      <ProgressBar value={pct} size="sm" />
                      <p className="text-xs text-gray-400 mt-1">Due {formatDate(template.due_date)}</p>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Activity feed */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                Recent Activity
              </h2>
            </div>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Clock size={28} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map(entry => {
                  const actor = getUser(entry.actor_id)
                  const task = myTasks.find(t => t.id === entry.task_id)
                  if (!actor) return null
                  const taskTitle = task ? getTaskDisplayTitle(task) : 'a task'
                  return (
                    <div key={entry.id} className="flex items-start gap-3">
                      {activityIcon(entry.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 leading-snug">
                          {activityText(entry, actor.name, taskTitle)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(entry.timestamp)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* My tasks quick list (staff only) */}
        {role === 'staff' && myTasks.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">My Tasks</h2>
              <Link href="/tasks" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {myTasks.slice(0, 4).map(task => {
                const isDone = task.status === 'approved' || task.status === 'submitted'
                const overdue = !isDone && isOverdue(task.due_date)
                return (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0 group"
                  >
                    {task.status === 'approved'
                      ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                      : task.status === 'submitted'
                      ? <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
                      : task.status === 'in_progress'
                      ? <PlayCircle size={16} className="text-amber-400 shrink-0" />
                      : <Clock size={16} className={overdue ? 'text-red-400 shrink-0' : 'text-gray-300 shrink-0'} />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDone ? 'text-gray-400 line-through' : 'text-gray-800 group-hover:text-indigo-600'}`}>
                        {getTaskDisplayTitle(task)}
                      </p>
                    </div>
                    {overdue && <span className="text-xs text-red-500 shrink-0">Overdue</span>}
                    {isDone && <span className="text-xs text-gray-400 shrink-0">{task.status === 'approved' ? 'Approved' : 'Submitted'}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
