'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, ReportTemplate, Task, OrgUnit } from './types'
import { users, templates as initialTemplates, tasks as initialTasks, orgUnits } from './mock-data'

interface AppState {
  currentUser: User | null
  authReady: boolean
  allUsers: User[]
  templates: ReportTemplate[]
  tasks: Task[]
  orgUnits: OrgUnit[]
  login: (email: string) => boolean
  logout: () => void
  addTemplate: (t: ReportTemplate) => void
  updateTemplate: (t: ReportTemplate) => void
  createTask: (t: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  getOrgUnit: (id: string) => OrgUnit | undefined
  getUser: (id: string) => User | undefined
  getTemplate: (id: string) => ReportTemplate | undefined
  getTasksForUser: () => Task[]
  getTasksForTemplate: (templateId: string) => Task[]
  getChildUnits: (parentId: string) => OrgUnit[]
  getChildTasks: (parentTaskId: string) => Task[]
  computeProgress: (templateId: string) => number
  getDirectReports: () => User[]         // users one level below current user
  getScopeOrgUnitIds: () => string[]     // all org unit IDs in current user's scope
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [templates, setTemplates] = useState<ReportTemplate[]>(initialTemplates)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  useEffect(() => {
    const stored = localStorage.getItem('rf_user')
    if (stored) setCurrentUser(JSON.parse(stored))
    setAuthReady(true)
  }, [])

  function login(email: string): boolean {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!user) return false
    setCurrentUser(user)
    localStorage.setItem('rf_user', JSON.stringify(user))
    return true
  }

  function logout() {
    setCurrentUser(null)
    localStorage.removeItem('rf_user')
  }

  function addTemplate(t: ReportTemplate) {
    setTemplates(prev => [t, ...prev])
  }

  function updateTemplate(t: ReportTemplate) {
    setTemplates(prev => prev.map(x => x.id === t.id ? t : x))
  }

  function createTask(t: Task) {
    setTasks(prev => [t, ...prev])
  }

  function updateTask(id: string, updates: Partial<Task>) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  function getOrgUnit(id: string) {
    return orgUnits.find(u => u.id === id)
  }

  function getUser(id: string) {
    return users.find(u => u.id === id)
  }

  function getTemplate(id: string) {
    return templates.find(t => t.id === id)
  }

  /** All org unit IDs in the current user's scope (their unit + everything below) */
  function getScopeOrgUnitIds(): string[] {
    if (!currentUser) return []
    if (currentUser.role === 'ceo') return orgUnits.map(u => u.id)
    if (currentUser.role === 'c_level') {
      const dirId = currentUser.org_unit_id
      const divisions = orgUnits.filter(u => u.parent_id === dirId)
      const units = orgUnits.filter(u => divisions.some(d => d.id === u.parent_id))
      return [dirId, ...divisions.map(d => d.id), ...units.map(u => u.id)]
    }
    if (currentUser.role === 'division_manager') {
      const divId = currentUser.org_unit_id
      const units = orgUnits.filter(u => u.parent_id === divId)
      return [divId, ...units.map(u => u.id)]
    }
    return [currentUser.org_unit_id]
  }

  function getTasksForUser(): Task[] {
    if (!currentUser) return []
    const scopeIds = getScopeOrgUnitIds()
    if (currentUser.role === 'ceo') return tasks
    return tasks.filter(t =>
      scopeIds.includes(t.org_unit_id) ||
      t.assigned_to_user_id === currentUser.id
    )
  }

  function getTasksForTemplate(templateId: string) {
    return tasks.filter(t => t.template_id === templateId)
  }

  function getChildUnits(parentId: string) {
    return orgUnits.filter(u => u.parent_id === parentId)
  }

  function getChildTasks(parentTaskId: string) {
    return tasks.filter(t => t.parent_task_id === parentTaskId)
  }

  function computeProgress(templateId: string): number {
    const relevant = tasks.filter(t => t.template_id === templateId && t.parent_task_id === null)
    if (relevant.length === 0) return 0
    const done = relevant.filter(t => t.status === 'approved' || t.status === 'submitted').length
    return Math.round((done / relevant.length) * 100)
  }

  /**
   * Users who are direct reports of the current user:
   * - Division Manager → staff in their division's units
   * - C-Level → division managers in their directorate's divisions
   * - CEO → all C-level users
   */
  function getDirectReports(): User[] {
    if (!currentUser) return []
    if (currentUser.role === 'ceo') {
      return users.filter(u => u.role === 'c_level')
    }
    if (currentUser.role === 'c_level') {
      const divisions = orgUnits.filter(u => u.parent_id === currentUser.org_unit_id)
      return users.filter(u => u.role === 'division_manager' && divisions.some(d => d.id === u.org_unit_id))
    }
    if (currentUser.role === 'division_manager') {
      const units = orgUnits.filter(u => u.parent_id === currentUser.org_unit_id)
      return users.filter(u => u.role === 'staff' && units.some(unit => unit.id === u.org_unit_id))
    }
    return []
  }

  return (
    <AppContext.Provider value={{
      currentUser, authReady, allUsers: users, templates, tasks, orgUnits,
      login, logout, addTemplate, updateTemplate, createTask, updateTask,
      getOrgUnit, getUser, getTemplate, getTasksForUser, getTasksForTemplate,
      getChildUnits, getChildTasks, computeProgress, getDirectReports, getScopeOrgUnitIds,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
