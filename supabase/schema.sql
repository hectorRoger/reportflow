-- ReportFlow database schema
-- Deploy to Supabase: Dashboard → SQL Editor → Run

-- Org hierarchy
create table org_units (
  id          text primary key,
  name        text not null,
  level       text check (level in ('national','province','district','sector','cell')) not null,
  parent_id   text references org_units(id)
);

-- Users (mirrors Supabase auth.users)
create table users (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null,
  email         text not null unique,
  role          text check (role in ('super_admin','manager','reporter','viewer')) not null default 'reporter',
  org_unit_id   text references org_units(id)
);

-- Report templates
create table report_templates (
  id               text primary key,
  title            text not null,
  description      text,
  status           text check (status in ('draft','active','closed')) not null default 'draft',
  created_by       uuid references users(id),
  created_at       timestamptz not null default now(),
  due_date         date not null,
  period           text not null,
  assigned_levels  text[] not null default '{}',
  fields           jsonb not null default '[]'
);

-- Tasks (one per org unit per template)
create table tasks (
  id              text primary key,
  template_id     text references report_templates(id) on delete cascade,
  org_unit_id     text references org_units(id),
  parent_task_id  text references tasks(id),
  status          text check (status in ('not_started','in_progress','submitted','approved','rejected')) not null default 'not_started',
  due_date        date not null,
  submitted_at    timestamptz,
  approved_at     timestamptz,
  responses       jsonb not null default '{}'
);

-- Row-level security
alter table org_units enable row level security;
alter table users enable row level security;
alter table report_templates enable row level security;
alter table tasks enable row level security;

-- Allow authenticated users to read org structure
create policy "org_units_read" on org_units for select using (auth.uid() is not null);

-- Users can read their own record; admins read all
create policy "users_read_own" on users for select using (auth.uid() = id);

-- Reporters can read active templates assigned to their level
create policy "templates_read" on report_templates for select using (
  auth.uid() in (select id from users where role in ('super_admin','manager'))
  or (status = 'active' and (
    select level from org_units where id = (select org_unit_id from users where id = auth.uid())
  ) = any(assigned_levels))
);

-- Super admins can create/update templates
create policy "templates_write" on report_templates for all using (
  auth.uid() in (select id from users where role = 'super_admin')
);

-- Users can read/update tasks for their org unit; admins see all
create policy "tasks_read" on tasks for select using (
  auth.uid() in (select id from users where role in ('super_admin','manager'))
  or org_unit_id = (select org_unit_id from users where id = auth.uid())
);

create policy "tasks_update" on tasks for update using (
  org_unit_id = (select org_unit_id from users where id = auth.uid())
  or auth.uid() in (select id from users where role in ('super_admin','manager'))
);

-- Computed progress view
create or replace view template_progress as
select
  t.id as template_id,
  t.title,
  count(tk.id) as total_tasks,
  count(tk.id) filter (where tk.status in ('submitted','approved')) as done_tasks,
  round(
    count(tk.id) filter (where tk.status in ('submitted','approved'))::numeric
    / nullif(count(tk.id), 0) * 100
  ) as completion_pct
from report_templates t
left join tasks tk on tk.template_id = t.id and tk.parent_task_id is null
group by t.id, t.title;
