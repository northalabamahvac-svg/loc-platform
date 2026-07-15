-- ============================================================
-- 005_hvac_surveys.sql
-- HVAC System Replacement Surveys (field estimator checklist)
-- ============================================================

create table if not exists cf_hvac_surveys (
  id            uuid primary key default gen_random_uuid(),
  created_by    uuid not null references auth.users(id),
  project_id    uuid references cf_projects(id) on delete set null,
  customer_name text not null default '',
  address       text,
  status        text not null default 'draft'
                  check (status in ('draft','submitted','sent_to_hcp')),
  data          jsonb not null default '{}',
  submitted_at  timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table cf_hvac_surveys enable row level security;

-- Any authenticated company user can work with surveys
-- (same model as cf_memberships / cf_schedule)
create policy "auth all hvac_surveys" on cf_hvac_surveys
  for all to authenticated using (true) with check (true);

create index if not exists cf_hvac_surveys_status_idx  on cf_hvac_surveys(status, created_at desc);
create index if not exists cf_hvac_surveys_creator_idx on cf_hvac_surveys(created_by);
