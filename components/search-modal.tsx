'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, FileText, ClipboardList, ChevronRight } from 'lucide-react'
import { useApp } from '@/lib/context'

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter()
  const { tasks, templates, getOrgUnit, getTaskDisplayTitle } = useApp()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const q = query.toLowerCase().trim()

  const taskResults = q
    ? tasks.filter(t => {
        const title = getTaskDisplayTitle(t).toLowerCase()
        const unit = getOrgUnit(t.org_unit_id)?.name.toLowerCase() ?? ''
        return title.includes(q) || unit.includes(q)
      }).slice(0, 5)
    : []

  const templateResults = q
    ? templates.filter(t => {
        const title = t.title.toLowerCase()
        const desc = t.description.toLowerCase()
        return title.includes(q) || desc.includes(q)
      }).slice(0, 3)
    : []

  const allResults = [
    ...taskResults.map(t => ({ type: 'task' as const, item: t, label: getTaskDisplayTitle(t), sub: getOrgUnit(t.org_unit_id)?.name ?? '', href: `/tasks/${t.id}` })),
    ...templateResults.map(t => ({ type: 'report' as const, item: t, label: t.title, sub: t.period, href: `/reports/${t.id}` })),
  ]

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected(s => Math.min(s + 1, allResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected(s => Math.max(s - 1, 0))
      } else if (e.key === 'Enter' && allResults[selected]) {
        router.push(allResults[selected].href)
        onClose()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, allResults, selected, router, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            placeholder="Search tasks, reports…"
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-300 hover:text-gray-500">
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100
            text-gray-400 text-xs rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {allResults.length > 0 && (
          <ul className="py-2 max-h-80 overflow-y-auto">
            {taskResults.length > 0 && (
              <li className="px-4 pt-2 pb-1">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Tasks</span>
              </li>
            )}
            {taskResults.map((task, i) => (
              <li key={task.id}>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                    ${selected === i ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                  onClick={() => { router.push(`/tasks/${task.id}`); onClose() }}
                  onMouseEnter={() => setSelected(i)}
                >
                  <ClipboardList size={15} className="text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{getTaskDisplayTitle(task)}</p>
                    <p className="text-xs text-gray-400">{getOrgUnit(task.org_unit_id)?.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    task.status === 'approved' ? 'bg-green-100 text-green-700' :
                    task.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                    task.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <ChevronRight size={13} className="text-gray-300 shrink-0" />
                </button>
              </li>
            ))}

            {templateResults.length > 0 && (
              <li className="px-4 pt-3 pb-1">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Reports</span>
              </li>
            )}
            {templateResults.map((tmpl, i) => {
              const idx = taskResults.length + i
              return (
                <li key={tmpl.id}>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                      ${selected === idx ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                    onClick={() => { router.push(`/reports/${tmpl.id}`); onClose() }}
                    onMouseEnter={() => setSelected(idx)}
                  >
                    <FileText size={15} className="text-indigo-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{tmpl.title}</p>
                      <p className="text-xs text-gray-400">{tmpl.period}</p>
                    </div>
                    <ChevronRight size={13} className="text-gray-300 shrink-0" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {/* Empty state */}
        {q && allResults.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-gray-500">No results for <strong>&ldquo;{query}&rdquo;</strong></p>
            <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
          </div>
        )}

        {/* Hint when empty */}
        {!q && (
          <div className="px-4 py-5 text-center">
            <p className="text-xs text-gray-400">Type to search tasks and reports</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 px-1 rounded font-mono text-[10px]">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 px-1 rounded font-mono text-[10px]">↵</kbd> open</span>
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 px-1 rounded font-mono text-[10px]">ESC</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
