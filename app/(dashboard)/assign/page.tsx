'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, CheckCircle2 } from 'lucide-react'
import { useApp } from '@/lib/context'
import { generateId, formatDate } from '@/lib/utils'
import type { Task } from '@/lib/types'

export default function AssignTaskPage() {
  const router = useRouter()
  const { currentUser, templates, tasks, getDirectReports, getOrgUnit, createTask, getTemplate } = useApp()

  const canAssign = currentUser?.role === 'division_manager' ||
    currentUser?.role === 'c_level' ||
    currentUser?.role === 'ceo'

  const directReports = getDirectReports()
  const activeTemplates = templates.filter(t => t.status === 'active')

  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [instructions, setInstructions] = useState('')
  const [dependsOn, setDependsOn] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  // All top-level tasks as dependency candidates
  const candidateTasks = tasks.filter(t => t.parent_task_id === null)

  if (!canAssign) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        You don&apos;t have permission to assign tasks.
      </div>
    )
  }

  const selectedUser = directReports.find(u => u.id === selectedUserId)
  const selectedTemplate = activeTemplates.find(t => t.id === selectedTemplateId)

  const assigneeLabel = currentUser?.role === 'division_manager' ? 'Staff in your division' :
    currentUser?.role === 'c_level' ? 'Division Managers in your directorate' :
    'C-Level executives'

  async function handleAssign() {
    if (!selectedTemplateId || !selectedUserId || !dueDate) {
      alert('Please select an activity, an assignee, and a due date.')
      return
    }
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))

    const task: Task = {
      id: generateId(),
      template_id: selectedTemplateId,
      org_unit_id: selectedUser!.org_unit_id,
      parent_task_id: null,
      depends_on: dependsOn.length > 0 ? dependsOn : undefined,
      assigned_to_user_id: selectedUserId,
      assigned_by_user_id: currentUser!.id,
      instructions: instructions.trim() || undefined,
      status: 'not_started',
      due_date: dueDate,
      responses: {},
    }
    createTask(task)
    setSaving(false)
    setDone(true)
  }

  function resetForm() {
    setDone(false)
    setSelectedTemplateId('')
    setSelectedUserId('')
    setDueDate('')
    setInstructions('')
    setDependsOn([])
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Task Assigned!</h2>
          <p className="text-gray-500 text-sm mb-2">
            <strong>{selectedTemplate?.title}</strong> has been assigned to{' '}
            <strong>{selectedUser?.name}</strong>.
          </p>
          <p className="text-xs text-gray-400">Due {formatDate(dueDate)}</p>
          {dependsOn.length > 0 && (
            <p className="text-xs text-amber-600 mt-1 mb-8">
              Blocked until {dependsOn.length} prerequisite task{dependsOn.length > 1 ? 's are' : ' is'} approved.
            </p>
          )}
          {dependsOn.length === 0 && <div className="mb-8" />}
          <div className="space-y-2">
            <button
              onClick={resetForm}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Assign Another Task
            </button>
            <button
              onClick={() => router.push('/team')}
              className="w-full py-3 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50"
            >
              View Team Reports
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ChevronLeft size={16} /> Back
        </button>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Assign a Task</h1>
          <p className="text-gray-500 text-sm mt-1">
            Select the activity, assign it to a team member, and set a deadline.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">

          {/* Activity */}
          <div className="p-6">
            <label className="block text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
              Step 1
            </label>
            <p className="font-semibold text-gray-900 mb-1">Which activity should be reported on?</p>
            <p className="text-xs text-gray-400 mb-3">
              This defines the fields the assignee will fill in.
            </p>
            <select
              value={selectedTemplateId}
              onChange={e => setSelectedTemplateId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">— Select an activity —</option>
              {activeTemplates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.period})
                </option>
              ))}
            </select>
            {selectedTemplate && (
              <p className="text-xs text-gray-400 mt-2 pl-1">
                {selectedTemplate.fields.length} fields · Due {formatDate(selectedTemplate.due_date)}
              </p>
            )}
          </div>

          {/* Assignee */}
          <div className="p-6">
            <label className="block text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
              Step 2
            </label>
            <p className="font-semibold text-gray-900 mb-1">Who should fill this report?</p>
            <p className="text-xs text-gray-400 mb-3">{assigneeLabel}</p>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">— Select an assignee —</option>
              {directReports.map(user => {
                const unit = getOrgUnit(user.org_unit_id)
                return (
                  <option key={user.id} value={user.id}>
                    {user.name} — {unit?.name}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Due date */}
          <div className="p-6">
            <label className="block text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
              Step 3
            </label>
            <p className="font-semibold text-gray-900 mb-1">When is this due?</p>
            <p className="text-xs text-gray-400 mb-3">The assignee will be notified of this deadline.</p>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Instructions */}
          <div className="p-6">
            <label className="block text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
              Step 4
            </label>
            <p className="font-semibold text-gray-900 mb-1">
              Additional instructions{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Shown to the assignee when they open the task.
            </p>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              rows={3}
              placeholder="e.g. Focus on schools in the northern cluster. Include tower status for sites 12–15."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* Dependencies */}
          <div className="p-6">
            <label className="block text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
              Step 5 <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <p className="font-semibold text-gray-900 mb-1">Does this task depend on other tasks?</p>
            <p className="text-xs text-gray-400 mb-3">
              The assignee won&apos;t be able to start until all selected tasks are approved.
            </p>
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
              {candidateTasks.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No existing tasks to depend on.</p>
              ) : (
                candidateTasks.map(t => {
                  const tmpl = getTemplate(t.template_id)
                  const unit = getOrgUnit(t.org_unit_id)
                  return (
                    <label key={t.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-4 py-3 border-b border-gray-100 last:border-0">
                      <input
                        type="checkbox"
                        checked={dependsOn.includes(t.id)}
                        onChange={e => setDependsOn(prev =>
                          e.target.checked ? [...prev, t.id] : prev.filter(id => id !== t.id)
                        )}
                        className="w-4 h-4 rounded text-indigo-600 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{tmpl?.title ?? t.template_id}</p>
                        <p className="text-xs text-gray-400">{unit?.name} · {t.status.replace('_', ' ')}</p>
                      </div>
                    </label>
                  )
                })
              )}
            </div>
            {dependsOn.length > 0 && (
              <p className="text-xs text-indigo-600 mt-2 font-medium">
                {dependsOn.length} prerequisite{dependsOn.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

        </div>

        <button
          onClick={handleAssign}
          disabled={saving || !selectedTemplateId || !selectedUserId || !dueDate}
          className="w-full mt-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
        >
          {saving ? 'Assigning…' : 'Assign Task →'}
        </button>
      </div>
    </div>
  )
}
