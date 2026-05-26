import type { OrgUnit, User, ReportTemplate, Task } from './types'

export const orgUnits: OrgUnit[] = [
  // Top
  { id: 'risa', name: 'RISA', level: 'organization', parent_id: null },

  // Directorates (C-level)
  { id: 'dir-ict',  name: 'Technology Directorate',            level: 'directorate', parent_id: 'risa' },
  { id: 'dir-dt',   name: 'Digital Transformation Directorate', level: 'directorate', parent_id: 'risa' },
  { id: 'dir-corp', name: 'Corporate Services Directorate',     level: 'directorate', parent_id: 'risa' },

  // Divisions (Division Manager level)
  { id: 'div-netops',  name: 'Software Solutions Division',        level: 'division', parent_id: 'dir-ict' },
  { id: 'div-syshard', name: 'Systems & Hardware Division',         level: 'division', parent_id: 'dir-ict' },
  { id: 'div-egov',    name: 'e-Government Division',               level: 'division', parent_id: 'dir-dt' },
  { id: 'div-citizen', name: 'Citizen Digital Services Division',   level: 'division', parent_id: 'dir-dt' },
  { id: 'div-finance', name: 'Finance & Procurement Division',      level: 'division', parent_id: 'dir-corp' },
  { id: 'div-hr',      name: 'Human Resources Division',            level: 'division', parent_id: 'dir-corp' },

  // Units (Staff level)
  { id: 'unit-conn',    name: 'Connectivity Unit',         level: 'unit', parent_id: 'div-netops' },
  { id: 'unit-fiber',   name: 'Backbone & Fiber Unit',     level: 'unit', parent_id: 'div-netops' },
  { id: 'unit-dc',      name: 'Data Centers Unit',         level: 'unit', parent_id: 'div-syshard' },
  { id: 'unit-hw',      name: 'Hardware & Assets Unit',    level: 'unit', parent_id: 'div-syshard' },
  { id: 'unit-irembo',  name: 'Irembo & Platforms Unit',   level: 'unit', parent_id: 'div-egov' },
  { id: 'unit-data',    name: 'Data & Analytics Unit',     level: 'unit', parent_id: 'div-egov' },
  { id: 'unit-citizen', name: 'Citizen Support Unit',      level: 'unit', parent_id: 'div-citizen' },
  { id: 'unit-ux',      name: 'UX & Training Unit',        level: 'unit', parent_id: 'div-citizen' },
  { id: 'unit-fin',     name: 'Finance & Budget Unit',     level: 'unit', parent_id: 'div-finance' },
  { id: 'unit-hr',      name: 'HR & Talent Unit',          level: 'unit', parent_id: 'div-hr' },
]

export const users: User[] = [
  // ── CEO ─────────────────────────────────────────────────────────────────────
  { id: 'u-ceo', name: 'Tony',   email: 'ceo@risa.gov.rw',   role: 'ceo',     org_unit_id: 'risa' },

  // ── C-Level (CTO · COSO · CFO) ──────────────────────────────────────────────
  { id: 'u-cto',  name: 'Roger',  email: 'cto@risa.gov.rw',   role: 'c_level', org_unit_id: 'dir-ict' },  // CTO
  { id: 'u-coso', name: 'Eric',   email: 'coso@risa.gov.rw',  role: 'c_level', org_unit_id: 'dir-dt' },   // COSO
  { id: 'u-cfo',  name: 'Grace',  email: 'cfo@risa.gov.rw',   role: 'c_level', org_unit_id: 'dir-corp' }, // CFO

  // ── Division Managers ───────────────────────────────────────────────────────
  { id: 'u-mgr1', name: 'Bruce',    email: 'manager@risa.gov.rw',   role: 'division_manager', org_unit_id: 'div-netops' },
  { id: 'u-mgr2', name: 'Claire',   email: 'manager2@risa.gov.rw',  role: 'division_manager', org_unit_id: 'div-egov' },
  { id: 'u-mgr3', name: 'Patrick',  email: 'manager3@risa.gov.rw',  role: 'division_manager', org_unit_id: 'div-syshard' },
  { id: 'u-mgr4', name: 'Diane',    email: 'manager4@risa.gov.rw',  role: 'division_manager', org_unit_id: 'div-citizen' },
  { id: 'u-mgr5', name: 'Samuel',   email: 'manager5@risa.gov.rw',  role: 'division_manager', org_unit_id: 'div-finance' },

  // ── Staff ───────────────────────────────────────────────────────────────────
  // Network Operations
  { id: 'u-s1',  name: 'Victor',   email: 'staff@risa.gov.rw',    role: 'staff', org_unit_id: 'unit-conn' },
  { id: 'u-s2',  name: 'Ester',    email: 'staff2@risa.gov.rw',   role: 'staff', org_unit_id: 'unit-fiber' },
  { id: 'u-s3',  name: 'Frank',    email: 'staff3@risa.gov.rw',   role: 'staff', org_unit_id: 'unit-conn' },

  // Systems & Hardware
  { id: 'u-s4',  name: 'Gloria',   email: 'staff4@risa.gov.rw',  role: 'staff', org_unit_id: 'unit-dc' },
  { id: 'u-s5',  name: 'Henri',    email: 'staff5@risa.gov.rw',  role: 'staff', org_unit_id: 'unit-hw' },

  // e-Government
  { id: 'u-s6',  name: 'Irene',    email: 'staff6@risa.gov.rw',  role: 'staff', org_unit_id: 'unit-irembo' },
  { id: 'u-s7',  name: 'Joseph',   email: 'staff7@risa.gov.rw',  role: 'staff', org_unit_id: 'unit-data' },

  // Citizen Digital Services
  { id: 'u-s8',  name: 'Keza',     email: 'staff8@risa.gov.rw',  role: 'staff', org_unit_id: 'unit-citizen' },
  { id: 'u-s9',  name: 'Leon',     email: 'staff9@risa.gov.rw',  role: 'staff', org_unit_id: 'unit-ux' },

  // Finance
  { id: 'u-s10', name: 'Marie',    email: 'staff10@risa.gov.rw', role: 'staff', org_unit_id: 'unit-fin' },
]

export const templates: ReportTemplate[] = [
  {
    id: 't1',
    title: 'ICT Infrastructure Weekly Report',
    description: 'Weekly tracking of connectivity coverage, infrastructure deployments, and operational status.',
    status: 'active',
    created_by: 'u-ceo',
    created_at: '2026-05-20T08:00:00Z',
    due_date: '2026-05-30',
    period: 'Week 22 — May 26–30, 2026',
    frequency: 'weekly',
    assigned_levels: ['unit', 'division'],
    fields: [
      { id: 'f1', label: 'Number of sites with active connectivity', type: 'number', required: true, help_text: 'Schools, hospitals, government offices' },
      { id: 'f2', label: 'Connectivity uptime (%)', type: 'percentage', required: true },
      { id: 'f3', label: 'Status of pending issues', type: 'select', required: true, options: ['All Resolved', 'In Progress', 'Escalated', 'New Issues Identified'] },
    ],
  },
  {
    id: 't2',
    title: 'Digital Services Adoption Q2 2026',
    description: 'Quarterly assessment of citizen uptake across all digital government platforms.',
    status: 'active',
    created_by: 'u-ceo',
    created_at: '2026-04-01T08:00:00Z',
    due_date: '2026-06-30',
    period: 'Q2 2026',
    frequency: 'quarterly',
    assigned_levels: ['unit', 'division'],
    fields: [
      { id: 'f1', label: 'Registered platform users',         type: 'number',     required: true },
      { id: 'f2', label: 'New registrations this quarter',    type: 'number',     required: true },
      { id: 'f3', label: 'Most used service',                 type: 'select',     required: true, options: ['Birth Certificate', 'Land Registration', 'Tax Filing', 'Business Registration', 'Other'] },
      { id: 'f4', label: 'User satisfaction score (1–10)',    type: 'number',     required: true, placeholder: '1–10' },
    ],
  },
  {
    id: 't3',
    title: 'Cybersecurity Compliance Audit — FY2026',
    description: 'Annual review of cybersecurity posture, incidents, and staff readiness.',
    status: 'active',
    created_by: 'u-cto',
    created_at: '2026-05-20T08:00:00Z',
    due_date: '2026-07-31',
    period: 'FY 2026',
    frequency: 'monthly',
    assigned_levels: ['unit', 'division', 'directorate'],
    fields: [
      { id: 'f1', label: 'Firewall & antivirus up to date?',    type: 'checkbox',   required: true },
      { id: 'f2', label: 'Date of last security audit',         type: 'date',       required: true },
      { id: 'f3', label: 'Incidents reported this year',        type: 'number',     required: true },
      { id: 'f4', label: 'Staff trained on cybersecurity (%)',  type: 'percentage', required: true },
      { id: 'f5', label: 'Risk level',                          type: 'select',     required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
    ],
  },
]

export const tasks: Task[] = [

  // ════════════════════════════════════════════════════════════════
  // T1 — ICT Infrastructure  (unit level — staff fill)
  // ════════════════════════════════════════════════════════════════
  {
    id: 'tk-s1-t1', template_id: 't1', org_unit_id: 'unit-conn', parent_task_id: null,
    assigned_to_user_id: 'u-s1', assigned_by_user_id: 'u-mgr1',
    instructions: 'Focus on schools in the northern cluster. Include tower status for sites 12–15.',
    status: 'submitted', due_date: '2026-05-31', submitted_at: '2026-05-24T10:00:00Z',
    responses: { f1: 47, f2: 72, f3: 'In Progress' },
    report: {
      accomplishments: 'Completed connectivity survey in 12 schools. Coordinated with MTN on 3 pending tower installations. Activated 4 new school sites.',
      progress_pct: 75,
      challenges: 'Power supply instability at 2 tower sites causing intermittent downtime. Access permission delayed at one government building.',
      next_steps: 'Resolve power issue with RURA by end of week. Complete final 4 site activations next week.',
    },
  },
  {
    id: 'tk-s2-t1', template_id: 't1', org_unit_id: 'unit-fiber', parent_task_id: null,
    assigned_to_user_id: 'u-s2', assigned_by_user_id: 'u-mgr1',
    depends_on: ['tk-s1-t1'],  // fiber backbone starts only after connectivity survey is approved
    status: 'in_progress', due_date: '2026-05-31',
    responses: { f1: 18 },
    report: {
      accomplishments: 'Laid 42 km of new fiber backbone along the northern corridor.',
      progress_pct: 45,
      challenges: 'Permit delays in two municipalities are holding up final splicing.',
      next_steps: 'Follow up with district offices on permits. Schedule splicing teams for next week.',
    },
  },
  {
    id: 'tk-s3-t1', template_id: 't1', org_unit_id: 'unit-conn', parent_task_id: null,
    assigned_to_user_id: 'u-s3', assigned_by_user_id: 'u-mgr1',
    depends_on: ['tk-s2-t1'],  // Frank's task starts only after Ester's fiber work is approved
    status: 'not_started', due_date: '2026-05-31',
    responses: {},
  },
  {
    id: 'tk-s4-t1', template_id: 't1', org_unit_id: 'unit-dc', parent_task_id: null,
    assigned_to_user_id: 'u-s4', assigned_by_user_id: 'u-mgr3',
    status: 'approved', due_date: '2026-05-31', submitted_at: '2026-05-22T09:00:00Z', approved_at: '2026-05-23T14:00:00Z',
    responses: { f1: 3, f2: 99, f3: 'All Resolved' },
    report: {
      accomplishments: 'All 3 data centers running at full capacity. Completed quarterly maintenance including cooling system checks.',
      progress_pct: 100,
      challenges: 'Minor cooling anomaly in DC-2 — resolved within 4 hours.',
      next_steps: 'Prepare Q3 capacity review report.',
    },
  },
  {
    id: 'tk-s5-t1', template_id: 't1', org_unit_id: 'unit-hw', parent_task_id: null,
    assigned_to_user_id: 'u-s5', assigned_by_user_id: 'u-mgr3',
    status: 'submitted', due_date: '2026-05-31', submitted_at: '2026-05-25T08:30:00Z',
    responses: { f1: 210, f2: 94, f3: 'In Progress' },
    report: {
      accomplishments: 'Audited 210 hardware assets across 6 offices. Flagged 14 units for replacement.',
      progress_pct: 80,
      challenges: '14 outdated machines still awaiting procurement approval.',
      next_steps: 'Submit procurement request this week for the 14 flagged units.',
    },
  },

  // ════════════════════════════════════════════════════════════════
  // T1 — ICT Infrastructure  (division level — managers fill)
  // ════════════════════════════════════════════════════════════════
  {
    id: 'tk-mgr1-t1', template_id: 't1', org_unit_id: 'div-netops', parent_task_id: null,
    assigned_to_user_id: 'u-mgr1', assigned_by_user_id: 'u-cto',
    depends_on: ['tk-s1-t1', 'tk-s2-t1'],  // Bruce's rollup depends on both unit tasks being approved
    status: 'in_progress', due_date: '2026-05-31',
    responses: { f1: 65, f2: 74 },
    report: {
      accomplishments: 'Reviewed all unit reports. Fiber backbone 45% complete. School connectivity progressing.',
      progress_pct: 60,
      challenges: 'Permit delays and power supply issues affecting two staff members.',
      next_steps: 'Escalate permit issue to CTO. Await resolution from RURA on power.',
    },
  },
  {
    id: 'tk-mgr3-t1', template_id: 't1', org_unit_id: 'div-syshard', parent_task_id: null,
    assigned_to_user_id: 'u-mgr3', assigned_by_user_id: 'u-cto',
    status: 'submitted', due_date: '2026-05-31', submitted_at: '2026-05-25T11:00:00Z',
    responses: { f1: 213, f2: 96, f3: 'In Progress' },
    report: {
      accomplishments: 'All data centers operational. Hardware audit complete across 6 offices.',
      progress_pct: 90,
      challenges: '14 hardware units pending procurement approval.',
      next_steps: 'Procurement request submitted. Awaiting approval.',
    },
  },

  // ════════════════════════════════════════════════════════════════
  // T2 — Digital Services  (unit level)
  // ════════════════════════════════════════════════════════════════
  {
    id: 'tk-s6-t2', template_id: 't2', org_unit_id: 'unit-irembo', parent_task_id: null,
    assigned_to_user_id: 'u-s6', assigned_by_user_id: 'u-mgr2',
    instructions: 'Ensure data covers all 5 service categories. Highlight the top performing service.',
    status: 'approved', due_date: '2026-06-30', submitted_at: '2026-05-20T10:00:00Z', approved_at: '2026-05-21T09:00:00Z',
    responses: { f1: 128500, f2: 9200, f3: 'Birth Certificate', f4: 8 },
    report: {
      accomplishments: 'Irembo platform onboarded 9,200 new users this quarter. Birth certificate service is the top-used with 42% of transactions.',
      progress_pct: 100,
      challenges: 'Server latency spike on May 14 — resolved in 2 hours.',
      next_steps: 'Push SMS notification campaign to drive Q3 registrations.',
    },
  },
  {
    id: 'tk-s7-t2', template_id: 't2', org_unit_id: 'unit-data', parent_task_id: null,
    assigned_to_user_id: 'u-s7', assigned_by_user_id: 'u-mgr2',
    status: 'in_progress', due_date: '2026-06-30',
    responses: { f1: 34000 },
    report: {
      accomplishments: 'Dashboard updated with Q2 analytics. Cross-platform data pipeline is 70% ready.',
      progress_pct: 55,
      challenges: 'API integration with e-Tax module still pending approval from RRA.',
      next_steps: 'Follow up with RRA integration team. Complete data pipeline by 10 June.',
    },
  },
  {
    id: 'tk-s8-t2', template_id: 't2', org_unit_id: 'unit-citizen', parent_task_id: null,
    assigned_to_user_id: 'u-s8', assigned_by_user_id: 'u-mgr4',
    status: 'not_started', due_date: '2026-06-30',
    responses: {},
  },
  {
    id: 'tk-s9-t2', template_id: 't2', org_unit_id: 'unit-ux', parent_task_id: null,
    assigned_to_user_id: 'u-s9', assigned_by_user_id: 'u-mgr4',
    status: 'rejected', due_date: '2026-06-30', submitted_at: '2026-05-23T14:00:00Z',
    reviewer_notes: 'The satisfaction score is missing and the registration count does not match the Irembo dashboard. Please recheck and resubmit.',
    responses: { f1: 15000, f2: 3100, f3: 'Land Registration' },
    report: {
      accomplishments: 'Conducted 3 user training workshops across Kigali. 3,100 new users onboarded via in-person sessions.',
      progress_pct: 60,
      challenges: 'Venue availability limited training sessions to mornings only.',
      next_steps: 'Schedule afternoon sessions in June to meet the quarterly target.',
    },
  },

  // ════════════════════════════════════════════════════════════════
  // T2 — Digital Services  (division level)
  // ════════════════════════════════════════════════════════════════
  {
    id: 'tk-mgr2-t2', template_id: 't2', org_unit_id: 'div-egov', parent_task_id: null,
    assigned_to_user_id: 'u-mgr2', assigned_by_user_id: 'u-coso',
    status: 'in_progress', due_date: '2026-06-30',
    responses: { f1: 162500 },
    report: {
      accomplishments: 'Irembo unit fully reported. Data analytics pipeline 55% complete.',
      progress_pct: 65,
      challenges: 'RRA integration blocking full data pipeline completion.',
      next_steps: 'Escalate RRA integration to CDO level.',
    },
  },
  {
    id: 'tk-mgr4-t2', template_id: 't2', org_unit_id: 'div-citizen', parent_task_id: null,
    assigned_to_user_id: 'u-mgr4', assigned_by_user_id: 'u-coso',
    status: 'not_started', due_date: '2026-06-30',
    responses: {},
  },

  // ════════════════════════════════════════════════════════════════
  // T3 — Cybersecurity Audit
  // ════════════════════════════════════════════════════════════════
  {
    id: 'tk-s1-t3', template_id: 't3', org_unit_id: 'unit-conn', parent_task_id: null,
    assigned_to_user_id: 'u-s1', assigned_by_user_id: 'u-mgr1',
    status: 'not_started', due_date: '2026-07-31',
    responses: {},
  },
  {
    id: 'tk-s4-t3', template_id: 't3', org_unit_id: 'unit-dc', parent_task_id: null,
    assigned_to_user_id: 'u-s4', assigned_by_user_id: 'u-mgr3',
    status: 'submitted', due_date: '2026-07-31', submitted_at: '2026-05-26T09:00:00Z',
    responses: { f1: true, f2: '2026-04-15', f3: 0, f4: 92, f5: 'Low' },
    report: {
      accomplishments: 'All systems patched to latest versions. Staff cybersecurity training completed with 92% participation. Zero incidents this year.',
      progress_pct: 100,
      challenges: 'None.',
      next_steps: 'Annual pen-test scheduled for July.',
    },
  },
  {
    id: 'tk-s6-t3', template_id: 't3', org_unit_id: 'unit-irembo', parent_task_id: null,
    assigned_to_user_id: 'u-s6', assigned_by_user_id: 'u-mgr2',
    status: 'in_progress', due_date: '2026-07-31',
    responses: { f1: true, f2: '2026-03-10', f3: 2 },
    report: {
      accomplishments: 'Firewall and antivirus updated. Last audit completed March 2026. Two minor incidents logged and resolved.',
      progress_pct: 70,
      challenges: 'Staff training completion at 68% — below the 80% target.',
      next_steps: 'Schedule remaining training sessions for June.',
    },
  },
  {
    id: 'tk-mgr1-t3', template_id: 't3', org_unit_id: 'div-netops', parent_task_id: null,
    assigned_to_user_id: 'u-mgr1', assigned_by_user_id: 'u-cto',
    status: 'not_started', due_date: '2026-07-31',
    responses: {},
  },
  {
    id: 'tk-ict-dir-t3', template_id: 't3', org_unit_id: 'dir-ict', parent_task_id: null,
    assigned_to_user_id: 'u-cto', assigned_by_user_id: 'u-ceo',
    status: 'not_started', due_date: '2026-07-31',
    responses: {},
  },
  {
    id: 'tk-fin-t3', template_id: 't3', org_unit_id: 'unit-fin', parent_task_id: null,
    assigned_to_user_id: 'u-s10', assigned_by_user_id: 'u-mgr5',
    status: 'not_started', due_date: '2026-07-31',
    responses: {},
  },
]
