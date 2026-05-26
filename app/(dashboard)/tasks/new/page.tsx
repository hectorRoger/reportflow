'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, Plus, Upload, Download, CheckCircle2,
  AlertCircle, X, FileSpreadsheet, Lock,
} from 'lucide-react'
import { useApp } from '@/lib/context'
import { generateId, formatDate } from '@/lib/utils'
import type { Task } from '@/lib/types'

// ─── CSV helpers ────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = '' }
    else { cur += ch }
  }
  result.push(cur.trim())
  return result
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0]).map(h =>
    h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '')
  )
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
  })
}

const SAMPLE_CSV = [
  'title,assignee_email,due_date,description,instructions,depends_on',
  '"Set up development environment","staff@risa.gov.rw","2026-06-05","Install and configure all dev tools","Ensure Node 20 and Docker are installed",',
  '"Write technical specification","staff2@risa.gov.rw","2026-06-10","Document API endpoints and data models","Include auth flows","Set up development environment"',
  '"Implement authentication","staff@risa.gov.rw","2026-06-18","Build JWT auth module","Use RS256 algorithm","Write technical specification"',
].join('\n')

// ─── Types ───────────────────────────────────────────────────────────────────

interface ImportRow {
  title: string
  assignee_email: string
  due_date: string
  description: string
  instructions: string
  depends_on_titles: string
  _assigneeId?: string
  _error?: string
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CreateTaskPage() {
  const router = useRouter()
  const {
    currentUser, allUsers, tasks,
    getOrgUnit, getDirectReports, createTask, getTaskDisplayTitle,
  } = useApp()

  const [mode, setMode] = useState<'single' | 'import'>('single')

  // Single task
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate]       = useState('')
  const [instructions, setInstructions] = useState('')
  const [dependsOn, setDependsOn]   = useState<string[]>([])
  const [saving, setSaving]         = useState(false)
  const [createdTask, setCreatedTask] = useState<Task | null>(null)

  // Import
  const [importRows, setImportRows] = useState<ImportRow[]>([])
  const [fileName, setFileName]     = useState('')
  const [importing, setImporting]   = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const canCreate = currentUser?.role === 'division_manager' ||
    currentUser?.role === 'c_level' ||
    currentUser?.role === 'ceo'

  if (!canCreate) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        You don&apos;t have permission to create tasks.
      </div>
    )
  }

  const directReports = getDirectReports()
  const candidateTasks = tasks.filter(t => t.parent_task_id === null)

  // ── Single task ──────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!title.trim() || !assigneeId || !dueDate) {
      alert('Please fill in the title, assignee, and due date.')
      return
    }
    setSaving(true)
    await new Promise(r => setTimeout(r, 350))
    const assignee = directReports.find(u => u.id === assigneeId)!
    const task: Task = {
      id: generateId(),
      template_id: 'adhoc',
      title: title.trim(),
      description: description.trim() || undefined,
      org_unit_id: assignee.org_unit_id,
      parent_task_id: null,
      depends_on: dependsOn.length > 0 ? dependsOn : undefined,
      assigned_to_user_id: assigneeId,
      assigned_by_user_id: currentUser!.id,
      instructions: instructions.trim() || undefined,
      status: 'not_started',
      due_date: dueDate,
      responses: {},
    }
    createTask(task)
    setCreatedTask(task)
    setSaving(false)
  }

  function resetSingle() {
    setTitle(''); setDescription(''); setAssigneeId('')
    setDueDate(''); setInstructions(''); setDependsOn([])
    setCreatedTask(null)
  }

  // ── CSV import ───────────────────────────────────────────────────────────

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      const rows = parseCSV(ev.target?.result as string)
      setImportRows(rows.map(row => {
        const email = (row['assignee_email'] || '').toLowerCase().trim()
        const assignee = allUsers.find(u => u.email.toLowerCase() === email)
        let error = ''
        if (!row['title']?.trim())          error = 'Missing title'
        else if (!email)                     error = 'Missing email'
        else if (!assignee)                  error = `Unknown: ${email}`
        else if (!row['due_date']?.trim())   error = 'Missing due date'
        return {
          title: row['title'] || '',
          assignee_email: row['assignee_email'] || '',
          due_date: row['due_date'] || '',
          description: row['description'] || '',
          instructions: row['instructions'] || '',
          depends_on_titles: row['depends_on'] || '',
          _assigneeId: assignee?.id,
          _error: error || undefined,
        }
      }))
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    const valid = importRows.filter(r => !r._error)
    if (!valid.length) return
    setImporting(true)
    await new Promise(r => setTimeout(r, 500))

    // First pass — assign IDs so deps can be resolved by title
    const idByTitle: Record<string, string> = {}
    const newTasks: Task[] = valid.map(row => {
      const id = generateId()
      idByTitle[row.title.trim()] = id
      const assignee = allUsers.find(u => u.email.toLowerCase() === row.assignee_email.toLowerCase())!
      return {
        id,
        template_id: 'adhoc',
        title: row.title.trim(),
        description: row.description.trim() || undefined,
        org_unit_id: assignee.org_unit_id,
        parent_task_id: null,
        assigned_to_user_id: assignee.id,
        assigned_by_user_id: currentUser!.id,
        instructions: row.instructions.trim() || undefined,
        status: 'not_started' as const,
        due_date: row.due_date.trim(),
        responses: {},
      }
    })

    // Second pass — resolve depends_on by title (batch + existing tasks)
    const finalTasks = newTasks.map((task, i) => {
      const raw = valid[i].depends_on_titles.trim()
      if (!raw) return task
      const depIds = raw.split(',').map(s => s.trim()).filter(Boolean).flatMap(t => {
        const inBatch = idByTitle[t]
        const existing = tasks.find(x => x.title === t || getTaskDisplayTitle(x) === t)?.id
        return inBatch ? [inBatch] : existing ? [existing] : []
      })
      return depIds.length ? { ...task, depends_on: depIds } : task
    })

    finalTasks.forEach(t => createTask(t))
    setImportedCount(finalTasks.length)
    setImporting(false)
  }

  const validRows = importRows.filter(r => !r._error)
  const errorRows = importRows.filter(r => r._error)

  // ── Success screens ──────────────────────────────────────────────────────

  if (createdTask) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Task Created!</h2>
          <p className="text-gray-500 text-sm mb-1">
            <strong>{createdTask.title}</strong> has been assigned to{' '}
            <strong>{directReports.find(u => u.id === createdTask.assigned_to_user_id)?.name}</strong>.
          </p>
          <p className="text-xs text-gray-400 mb-8">Due {formatDate(createdTask.due_date)}</p>
          <div className="space-y-2">
            <button
              onClick={resetSingle}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl"
            >
              Create Another Task
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

  if (importedCount > 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{importedCount} Tasks Created!</h2>
          <p className="text-gray-500 text-sm mb-8">
            All imported tasks have been assigned and are now visible in the team task list.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => { setImportRows([]); setFileName(''); setImportedCount(0) }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl"
            >
              Import More Tasks
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

  // ── Main UI ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ChevronLeft size={16} /> Back
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create Task</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create a single task or import a batch from a CSV file.
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {(['single', 'import'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === m
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m === 'single' ? 'Single Task' : 'Import from CSV'}
            </button>
          ))}
        </div>

        {/* ── Single Task ── */}
        {mode === 'single' && (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">

            {/* Title + Description */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Deploy staging environment"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What needs to be done?"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            {/* Assignee */}
            <div className="p-6">
              <label className="block text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
                Assignee <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-3">Who will work on this task?</p>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— Select assignee —</option>
                {directReports.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} — {getOrgUnit(user.org_unit_id)?.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div className="p-6">
              <label className="block text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Instructions */}
            <div className="p-6">
              <label className="block text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
                Instructions <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                rows={2}
                placeholder="Additional context shown to the assignee..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>

            {/* Dependencies */}
            <div className="p-6">
              <label className="block text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
                Dependencies <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <p className="text-xs text-gray-400 mb-3">
                This task won&apos;t start until all selected tasks are approved.
              </p>
              {candidateTasks.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No existing tasks to depend on yet.</p>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {candidateTasks.map(t => (
                    <label
                      key={t.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-4 py-3 border-b border-gray-100 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={dependsOn.includes(t.id)}
                        onChange={e => setDependsOn(prev =>
                          e.target.checked ? [...prev, t.id] : prev.filter(id => id !== t.id)
                        )}
                        className="w-4 h-4 rounded text-indigo-600 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{getTaskDisplayTitle(t)}</p>
                        <p className="text-xs text-gray-400">
                          {getOrgUnit(t.org_unit_id)?.name} · {t.status.replace('_', ' ')}
                        </p>
                      </div>
                      {dependsOn.includes(t.id) && (
                        <Lock size={13} className="text-amber-500 shrink-0" />
                      )}
                    </label>
                  ))}
                </div>
              )}
              {dependsOn.length > 0 && (
                <p className="text-xs text-indigo-600 mt-2 font-medium">
                  {dependsOn.length} prerequisite{dependsOn.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

          </div>
        )}

        {/* ── Import from CSV ── */}
        {mode === 'import' && (
          <div className="space-y-4">

            {/* Download template */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-indigo-900">Download CSV template</p>
                <p className="text-xs text-indigo-600 mt-0.5">
                  Fill in the sample file then upload it below
                </p>
              </div>
              <a
                href={'data:text/csv;charset=utf-8,' + encodeURIComponent(SAMPLE_CSV)}
                download="tasks_template.csv"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
              >
                <Download size={14} /> Template
              </a>
            </div>

            {/* Upload area */}
            <div
              className="bg-white border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-2xl p-8 text-center cursor-pointer transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFile}
              />
              <FileSpreadsheet size={32} className="mx-auto text-gray-300 mb-3" />
              {fileName ? (
                <>
                  <p className="text-sm font-semibold text-gray-800">{fileName}</p>
                  <p className="text-xs text-gray-400 mt-1">Click to replace</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-700">Click to upload CSV</p>
                  <p className="text-xs text-gray-400 mt-1">Columns: title, assignee_email, due_date, description, instructions, depends_on</p>
                </>
              )}
            </div>

            {/* Preview table */}
            {importRows.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {importRows.length} row{importRows.length > 1 ? 's' : ''} found
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {validRows.length} ready · {errorRows.length} with errors
                    </p>
                  </div>
                  <button
                    onClick={() => { setImportRows([]); setFileName('') }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[520px]">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr className="text-xs text-gray-500 uppercase tracking-wide">
                        <th className="text-left px-4 py-2.5 font-medium">Title</th>
                        <th className="text-left px-4 py-2.5 font-medium">Assignee</th>
                        <th className="text-left px-4 py-2.5 font-medium">Due</th>
                        <th className="text-left px-4 py-2.5 font-medium">Depends on</th>
                        <th className="px-4 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {importRows.map((row, i) => {
                        const assignee = allUsers.find(u => u.id === row._assigneeId)
                        return (
                          <tr key={i} className={row._error ? 'bg-red-50' : ''}>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-800 truncate max-w-[180px]">
                                {row.title || <span className="text-gray-300 italic">—</span>}
                              </p>
                              {row.description && (
                                <p className="text-xs text-gray-400 truncate max-w-[180px]">{row.description}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {assignee ? (
                                <span className="text-gray-700">{assignee.name}</span>
                              ) : (
                                <span className="text-red-500">{row.assignee_email || '—'}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {row.due_date
                                ? formatDate(row.due_date)
                                : <span className="text-red-400">Missing</span>}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 max-w-[140px] truncate">
                              {row.depends_on_titles || '—'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {row._error ? (
                                <span className="flex items-center gap-1 text-xs text-red-500 justify-end">
                                  <AlertCircle size={12} /> {row._error}
                                </span>
                              ) : (
                                <CheckCircle2 size={15} className="text-green-500 ml-auto" />
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-5">
          {mode === 'single' && (
            <button
              onClick={handleCreate}
              disabled={saving || !title.trim() || !assigneeId || !dueDate}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? 'Creating…' : (
                <><Plus size={16} /> Create Task</>
              )}
            </button>
          )}

          {mode === 'import' && importRows.length > 0 && (
            <button
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {importing ? 'Creating tasks…' : (
                <><Upload size={16} /> Create {validRows.length} Task{validRows.length !== 1 ? 's' : ''}</>
              )}
            </button>
          )}

          {mode === 'import' && importRows.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-2">
              Upload a CSV file to preview and import tasks.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
