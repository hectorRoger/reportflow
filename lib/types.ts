export type UserRole = 'ceo' | 'c_level' | 'division_manager' | 'staff'
export type OrgLevel = 'organization' | 'directorate' | 'division' | 'unit'
export type FieldType = 'text' | 'number' | 'percentage' | 'date' | 'select' | 'textarea' | 'checkbox' | 'file'
export type ReportStatus = 'draft' | 'active' | 'closed'
export type TaskStatus = 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'rejected'
export type ReportFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly'

export interface OrgUnit {
  id: string
  name: string
  level: OrgLevel
  parent_id: string | null
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  org_unit_id: string
}

export interface FormField {
  id: string
  label: string
  type: FieldType
  required: boolean
  options?: string[]
  placeholder?: string
  help_text?: string
}

export interface ReportTemplate {
  id: string
  title: string
  description: string
  status: ReportStatus
  created_by: string
  created_at: string
  due_date: string
  period: string
  frequency?: ReportFrequency
  assigned_levels: OrgLevel[]
  fields: FormField[]
}

export interface TaskReport {
  accomplishments: string
  progress_pct: number
  challenges: string
  next_steps: string
  attachment_name?: string
}

export interface Task {
  id: string
  template_id: string
  org_unit_id: string
  parent_task_id: string | null
  depends_on?: string[]           // task IDs that must be 'approved' before this starts
  assigned_to_user_id?: string   // specific user assigned
  assigned_by_user_id?: string   // who created/assigned this task
  instructions?: string          // extra notes from the assigner
  status: TaskStatus
  due_date: string
  submitted_at?: string
  approved_at?: string
  approved_by?: string           // user id of approver
  reviewer_notes?: string        // feedback from manager on submission
  responses: Record<string, unknown>
  report?: TaskReport
}
