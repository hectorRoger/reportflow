'use client'

import Link from 'next/link'
import { Plus, FileText, Users, Calendar } from 'lucide-react'
import { useApp } from '@/lib/context'
import { ProgressBar } from '@/components/progress-bar'
import { reportStatusColor, formatDate, levelLabel } from '@/lib/utils'

export default function ReportsPage() {
  const { currentUser, templates, computeProgress, getTasksForTemplate } = useApp()
  const canCreate = currentUser?.role === 'ceo' || currentUser?.role === 'c_level'

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">All reporting templates and their progress</p>
        </div>
        {canCreate && (
          <Link
            href="/reports/new"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            New Report
          </Link>
        )}
      </div>

      <div className="grid gap-4">
        {templates.map(template => {
          const pct = computeProgress(template.id)
          const tasks = getTasksForTemplate(template.id)
          const submitted = tasks.filter(t => t.status === 'submitted' || t.status === 'approved').length

          return (
            <Link
              key={template.id}
              href={`/reports/${template.id}`}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-sm transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={17} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{template.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${reportStatusColor(template.status)}`}>
                        {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{template.description}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 sm:mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {template.period} · Due {formatDate(template.due_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {template.assigned_levels.map(levelLabel).join(', ')}
                      </span>
                      <span>{template.fields.length} fields</span>
                    </div>
                  </div>
                </div>

                <div className="sm:w-40 shrink-0">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Progress</span>
                    <span>{submitted}/{tasks.length} submitted</span>
                  </div>
                  <ProgressBar value={pct} size="sm" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
