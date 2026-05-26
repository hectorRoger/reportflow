'use client'

import Link from 'next/link'
import { FileText, ClipboardList, CheckCircle, AlertCircle, ArrowRight, Clock } from 'lucide-react'
import { useApp } from '@/lib/context'
import { StatsCard } from '@/components/stats-card'
import { ProgressBar } from '@/components/progress-bar'
import { statusLabel, statusColor, formatDate, isOverdue } from '@/lib/utils'

export default function DashboardPage() {
  const { currentUser, templates, getTasksForUser, computeProgress, getOrgUnit } = useApp()

  const myTasks = getTasksForUser()
  const totalTasks = myTasks.length
  const doneTasks = myTasks.filter(t => t.status === 'approved' || t.status === 'submitted').length
  const overdueTasks = myTasks.filter(t => t.status !== 'approved' && isOverdue(t.due_date)).length
  const activeTemplates = templates.filter(t => t.status === 'active').length

  const recentTasks = myTasks.slice(0, 5)

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-6xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Good morning, {currentUser?.name.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {"Here's what's happening across your reporting scope today."}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatsCard
          label="Active Reports"
          value={activeTemplates}
          icon={<FileText size={18} className="text-indigo-600" />}
          color="bg-indigo-50"
        />
        <StatsCard
          label="Total Tasks"
          value={totalTasks}
          icon={<ClipboardList size={18} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatsCard
          label="Submitted / Approved"
          value={doneTasks}
          icon={<CheckCircle size={18} className="text-green-600" />}
          color="bg-green-50"
          sub={`${totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}% completion`}
        />
        <StatsCard
          label="Overdue"
          value={overdueTasks}
          icon={<AlertCircle size={18} className="text-red-500" />}
          color="bg-red-50"
          sub={overdueTasks > 0 ? 'Needs attention' : 'All on track'}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Active Reports</h2>
            <Link href="/reports" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-4">
            {templates.filter(t => t.status === 'active').map(template => {
              const pct = computeProgress(template.id)
              return (
                <Link key={template.id} href={`/reports/${template.id}`} className="block group">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 transition-colors">{template.title}</p>
                    <span className="text-xs text-gray-400 ml-2 shrink-0">{template.period}</span>
                  </div>
                  <ProgressBar value={pct} size="sm" />
                  <p className="text-xs text-gray-400 mt-1">Due {formatDate(template.due_date)}</p>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">My Recent Tasks</h2>
            <Link href="/tasks" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentTasks.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">No tasks assigned yet.</p>
            )}
            {recentTasks.map(task => {
              const unit = getOrgUnit(task.org_unit_id)
              const overdue = task.status !== 'approved' && isOverdue(task.due_date)
              return (
                <Link
                  key={task.id}
                  href={`/reports/${task.template_id}`}
                  className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0 group"
                >
                  <div>
                    <p className="text-sm text-gray-800 group-hover:text-indigo-600">{unit?.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock size={11} className={overdue ? 'text-red-400' : 'text-gray-300'} />
                      <span className={`text-xs ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                        {overdue ? 'Overdue · ' : ''}{formatDate(task.due_date)}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(task.status)}`}>
                    {statusLabel(task.status)}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
