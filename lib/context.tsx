'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, ReportTemplate, Task, OrgUnit, TaskComment, ActivityEntry, ActivityType } from './types'
import { users, templates as initialTemplates, tasks as initialTasks, orgUnits, comments as initialComments, activityLog as initialActivityLog } from './mock-data'
import { generateId } from './utils'

interface AppState {
  currentUser: User | null
  authReady: boolean
  allUsers: User[]
  templates: ReportTemplate[]
  tasks: Task[]
  orgUnits: OrgUnit[]
  comments: TaskComment[]
  activityLog: ActivityEntry[]
  login: (email: string) => boolean
  logout: () => void
  addTemplate: (t: ReportTemplate) => void
  updateTemplate: (t: ReportTemplate) => void
  createTask: (t: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  addComment: (taskId: string, content: string) => void
  addActivity: (type: ActivityType, taskId: string, note?: string) => void
  getTaskComments: (taskId: string) => TaskComment[]
  getRecentActivity: (limit?: number) => ActivityEntry[]
  getOrgUnit: (id: string) => OrgUnit | undefined
  getUser: (id: string) => User | undefined
  getTemplate: (id: string) => ReportTemplate | undefined
  getTasksForUser: () => Task[]
  getTasksForTemplate: (templateId: string) => Task[]
  getChildUnits: (parentId: string) => OrgUnit[]
  getChildTasks: (parentTaskId: string) => Task[]
  computeProgress: (templateId: string) => number
  getDirectReports: () => User[]
  getScopeOrgUnitIds: () => string[]
  isTaskBlocked: (taskId: string) => boolean
  getBlockingTasks: (taskId: string) => Task[]
  computeChildProgress: (parentTaskId: string) => number
  getTaskDisplayTitle: (task: Task) => string
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [templates, setTemplates] = useState<ReportTemplate[]>(initialTemplates)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [comments, setComments] = useState<TaskComment[]>(initialComments)
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>(initialActivityLog)

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
    // Log task creation
    if (currentUser) {
      const entry: ActivityEntry = {
        id: generateId(),
        type: 'task_created',
        task_id: t.id,
        actor_id: currentUser.id,
        timestamp: new Date().toISOString(),
      }
      setActivityLog(prev => [entry, ...prev])
    }
  }

  function updateTask(id: string, updates: Partial<Task>) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))

    // Auto-log status transitions
    if (currentUser && updates.status) {
      let type: ActivityType | null = null
      if (updates.status === 'submitted') type = 'task_submitted'
      else if (updates.status === 'approved') type = 'task_approved'
      else if (updates.status === 'rejected') type = 'task_rejected'
      if (type) {
        const entry: ActivityEntry = {
          id: generateId(),
          type,
          task_id: id,
          actor_id: currentUser.id,
          timestamp: new Date().toISOString(),
          note: updates.reviewer_notes,
        }
        setActivityLog(prev => [entry, ...prev])
      }
    }
  }

  function addComment(taskId: string, content: string) {
    if (!currentUser || !content.trim()) return
    const comment: TaskComment = {
      id: generateId(),
      task_id: taskId,
      author_id: currentUser.id,
      content: content.trim(),
      created_at: new Date().toISOString(),
    }
    setComments(prev => [...prev, comment])
    const entry: ActivityEntry = {
      id: generateId(),
      type: 'comment_added',
      task_id: taskId,
      actor_id: currentUser.id,
      timestamp: new Date().toISOString(),
      note: content.trim().slice(0, 80),
    }
    setActivityLog(prev => [entry, ...prev])
  }

  function addActivity(type: ActivityType, taskId: string, note?: string) {
    if (!currentUser) return
    const entry: ActivityEntry = {
      id: generateId(),
      type,
      task_id: taskId,
      actor_id: currentUser.id,
      timestamp: new Date().toISOString(),
      note,
    }
    setActivityLog(prev => [entry, ...prev])
  }

  function getTaskComments(taskId: string): TaskComment[] {
    return comments.filter(c => c.task_id === taskId).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }

  function getRecentActivity(limit = 20): ActivityEntry[] {
    const scopeIds = getScopeOrgUnitIds()
    const scopeTaskIds = tasks
      .filter(t => scopeIds.includes(t.org_unit_id))
      .map(t => t.id)
    return activityLog
      .filter(e => scopeTaskIds.includes(e.task_id))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
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

  /** Returns true if any predecessor task is not yet approved */
  function isTaskBlocked(taskId: string): boolean {
    const task = tasks.find(t => t.id === taskId)
    if (!task?.depends_on?.length) return false
    return task.depends_on.some(depId => {
      const dep = tasks.find(t => t.id === depId)
      return !dep || dep.status !== 'approved'
    })
  }

  /** Returns the predecessor tasks that are blocking this task */
  function getBlockingTasks(taskId: string): Task[] {
    const task = tasks.find(t => t.id === taskId)
    if (!task?.depends_on?.length) return []
    return task.depends_on
      .map(depId => tasks.find(t => t.id === depId))
      .filter((t): t is Task => !!t && t.status !== 'approved')
  }

  /** Display title for a task — uses task.title for ad-hoc tasks, template title otherwise */
  function getTaskDisplayTitle(task: Task): string {
    if (task.title) return task.title
    const tmpl = templates.find(t => t.id === task.template_id)
    return tmpl?.title || 'Untitled Task'
  }

  /** Average progress_pct of all direct children of a parent task */
  function computeChildProgress(parentTaskId: string): number {
    const children = tasks.filter(t => t.parent_task_id === parentTaskId)
    if (children.length === 0) return 0
    const sum = children.reduce((acc, t) => acc + (t.report?.progress_pct ?? 0), 0)
    return Math.round(sum / children.length)
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
      comments, activityLog,
      login, logout, addTemplate, updateTemplate, createTask, updateTask,
      addComment, addActivity, getTaskComments, getRecentActivity,
      getOrgUnit, getUser, getTemplate, getTasksForUser, getTasksForTemplate,
      getChildUnits, getChildTasks, computeProgress, getDirectReports, getScopeOrgUnitIds,
      isTaskBlocked, getBlockingTasks, computeChildProgress, getTaskDisplayTitle,
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
