'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, GripVertical, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useApp } from '@/lib/context'
import { generateId } from '@/lib/utils'
import type { FormField, FieldType, OrgLevel, ReportTemplate } from '@/lib/types'

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'file', label: 'File Upload' },
]

const LEVELS: { value: OrgLevel; label: string }[] = [
  { value: 'organization', label: 'Organisation' },
  { value: 'directorate',  label: 'Directorate' },
  { value: 'division',     label: 'Division' },
  { value: 'unit',         label: 'Unit' },
]

export default function NewReportPage() {
  const router = useRouter()
  const { currentUser, addTemplate } = useApp()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [period, setPeriod] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignedLevels, setAssignedLevels] = useState<OrgLevel[]>(['division'])
  const [fields, setFields] = useState<FormField[]>([
    { id: generateId(), label: '', type: 'text', required: true },
  ])
  const [saving, setSaving] = useState(false)

  if (currentUser?.role !== 'ceo' && currentUser?.role !== 'c_level') {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        You don't have permission to create reports.
      </div>
    )
  }

  function addField() {
    setFields(prev => [...prev, { id: generateId(), label: '', type: 'text', required: false }])
  }

  function removeField(id: string) {
    setFields(prev => prev.filter(f => f.id !== id))
  }

  function updateField(id: string, updates: Partial<FormField>) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  function toggleLevel(level: OrgLevel) {
    setAssignedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    )
  }

  async function handleSave(status: 'draft' | 'active') {
    if (!title.trim() || fields.some(f => !f.label.trim())) {
      alert('Please fill in the report title and all field labels.')
      return
    }
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))

    const template: ReportTemplate = {
      id: generateId(),
      title: title.trim(),
      description: description.trim(),
      status,
      created_by: currentUser!.id,
      created_at: new Date().toISOString(),
      due_date: dueDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      period: period.trim() || 'Custom',
      assigned_levels: assignedLevels,
      fields,
    }
    addTemplate(template)
    router.push('/reports')
  }

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/reports" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft size={16} /> Back to Reports
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create New Report</h1>
        <p className="text-gray-500 text-sm mt-1">Define the template, fields, and who needs to fill it.</p>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Report Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. ICT Infrastructure Monthly Report"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="What is this report tracking?"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Period</label>
              <input
                value={period}
                onChange={e => setPeriod(e.target.value)}
                placeholder="e.g. May 2026, Q2 2026"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Assign to Levels */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Assign to Org Levels</h2>
          <p className="text-xs text-gray-400 mb-4">Which levels of the hierarchy need to fill this report?</p>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => toggleLevel(value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  assignedLevels.includes(value)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Form Fields</h2>
              <p className="text-xs text-gray-400 mt-0.5">Questions reporters will answer</p>
            </div>
            <button
              onClick={addField}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <Plus size={15} /> Add Field
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50 group">
                <div className="mt-2.5 text-gray-300 cursor-grab">
                  <GripVertical size={16} />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Field Label *</label>
                    <input
                      value={field.label}
                      onChange={e => updateField(field.id, { label: e.target.value })}
                      placeholder={`Question ${index + 1}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                    <select
                      value={field.type}
                      onChange={e => updateField(field.id, { type: e.target.value as FieldType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {FIELD_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Help text (optional)</label>
                    <input
                      value={field.help_text || ''}
                      onChange={e => updateField(field.id, { help_text: e.target.value })}
                      placeholder="Hint for the reporter"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  {field.type === 'select' && (
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Options (comma-separated)</label>
                      <input
                        value={(field.options || []).join(', ')}
                        onChange={e => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="Option 1, Option 2, Option 3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`req-${field.id}`}
                      checked={field.required}
                      onChange={e => updateField(field.id, { required: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <label htmlFor={`req-${field.id}`} className="text-xs text-gray-600">Required</label>
                  </div>
                </div>
                <button
                  onClick={() => removeField(field.id)}
                  className="mt-2 p-1.5 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end pb-8">
          <Link href="/reports" className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg">
            Cancel
          </Link>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSave('active')}
            disabled={saving}
            className="px-4 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 font-medium"
          >
            {saving ? 'Publishing…' : 'Publish Report'}
          </button>
        </div>
      </div>
    </div>
  )
}
