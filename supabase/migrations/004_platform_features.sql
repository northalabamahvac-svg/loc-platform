-- ============================================================
-- 004_platform_features.sql
-- Estimates, Booking, Dispatch, Job Costing,
-- Memberships, Follow-ups, schema additions
-- ============================================================

-- ── Extend cf_projects ─────────────────────────────────────
alter table cf_projects add column if not exists budget_cents    integer default 0;
alter table cf_projects add column if not exists customer_name   text;
alter table cf_projects add column if not exists customer_email  text;
alter table cf_projects add column if not exists customer_phone  text;
alter table cf_projects add column if not exists scheduled_date  date;

-- ── 1. Good / Better / Best Estimates ──────────────────────
create table if not exists cf_estimates (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references cf_projects(id) on delete cascade,
  created_by    uuid not null references auth.users(id),
  title         text not null default 'Project Estimate',
  status        text not null default 'draft'
                  check (status in ('draft','sent','accepted','declined')),
  accepted_tier text check (accepted_tier in ('good','better','best')),
  token         text unique default encode(gen_random_bytes(16),'hex'),
  notes         text,
  created_at    timestamptz default now()
);

create table if not exists cf_estimate_tiers (
  id          uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references cf_estimates(id) on delete cascade,
  tier        text not null check (tier in ('good','better','best')),
  label       text not null,
  price_cents integer not null default 0,
  description text,
  includes    text[] default '{}',
  position    integer default 0
);

alter table cf_estimates enable row level security;
alter table cf_estimate_tiers enable row level security;

create policy "members can view estimates" on cf_estimates for select using (
  exists (select 1 from cf_project_members
          where project_id = cf_estimates.project_id and user_id = auth.uid())
);
create policy "staff+ can manage estimates" on cf_estimates for all using (
  exists (select 1 from cf_project_members
          where project_id = cf_estimates.project_id
            and user_id = auth.uid() and role in ('owner','staff'))
) with check (
  exists (select 1 from cf_project_members
          where project_id = cf_estimates.project_id
            and user_id = auth.uid() and role in ('owner','staff'))
);
create policy "members can view tiers" on cf_estimate_tiers for select using (
  exists (select 1 from cf_estimates e
          join cf_project_members m on m.project_id = e.project_id
          where e.id = cf_estimate_tiers.estimate_id and m.user_id = auth.uid())
);
create policy "staff+ can manage tiers" on cf_estimate_tiers for all using (
  exists (select 1 from cf_estimates e
          join cf_project_members m on m.project_id = e.project_id
          where e.id = cf_estimate_tiers.estimate_id
            and m.user_id = auth.uid() and m.role in ('owner','staff'))
) with check (
  exists (select 1 from cf_estimates e
          join cf_project_members m on m.project_id = e.project_id
          where e.id = cf_estimate_tiers.estimate_id
            and m.user_id = auth.uid() and m.role in ('owner','staff'))
);

create index if not exists cf_estimates_project_idx on cf_estimates(project_id);
create index if not exists cf_estimates_token_idx   on cf_estimates(token);
create index if not exists cf_tiers_estimate_idx    on cf_estimate_tiers(estimate_id);

-- ── 2. Customer Booking Requests ───────────────────────────
create table if not exists cf_booking_requests (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null,
  phone          text,
  service_type   text,
  address        text,
  preferred_date date,
  preferred_time text,
  notes          text,
  status         text not null default 'new'
                   check (status in ('new','contacted','booked','cancelled')),
  assigned_to    uuid references auth.users(id),
  created_at     timestamptz default now()
);

alter table cf_booking_requests enable row level security;

-- Anybody (anon) can submit a booking
create policy "anon can submit booking" on cf_booking_requests
  for insert to anon with check (true);

-- Authenticated staff see all bookings
create policy "auth can view bookings" on cf_booking_requests
  for select to authenticated using (true);

create policy "auth can update bookings" on cf_booking_requests
  for update to authenticated using (true) with check (true);

create index if not exists cf_bookings_status_idx on cf_booking_requests(status, created_at desc);

-- ── 3. Dispatch / Schedule ─────────────────────────────────
create table if not exists cf_schedule (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references cf_projects(id) on delete cascade,
  assigned_to   uuid references auth.users(id),
  scheduled_date date not null,
  start_time    time,
  end_time      time,
  title         text,
  notes         text,
  created_at    timestamptz default now()
);

alter table cf_schedule enable row level security;
create policy "auth all schedule" on cf_schedule
  for all to authenticated using (true) with check (true);

create index if not exists cf_schedule_date_idx    on cf_schedule(scheduled_date);
create index if not exists cf_schedule_tech_idx    on cf_schedule(assigned_to, scheduled_date);
create index if not exists cf_schedule_project_idx on cf_schedule(project_id);

-- ── 4. Job Costing ─────────────────────────────────────────
create table if not exists cf_job_costs (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references cf_projects(id) on delete cascade,
  created_by  uuid not null references auth.users(id),
  type        text not null check (type in ('labor','material','subcontractor','overhead','other')),
  description text not null,
  amount_cents integer not null default 0,
  quantity    numeric(10,2) default 1,
  cost_date   date default current_date,
  created_at  timestamptz default now()
);

alter table cf_job_costs enable row level security;
create policy "members can view costs" on cf_job_costs for select using (
  exists (select 1 from cf_project_members
          where project_id = cf_job_costs.project_id and user_id = auth.uid())
);
create policy "staff+ can manage costs" on cf_job_costs for all using (
  exists (select 1 from cf_project_members
          where project_id = cf_job_costs.project_id
            and user_id = auth.uid() and role in ('owner','staff'))
) with check (
  exists (select 1 from cf_project_members
          where project_id = cf_job_costs.project_id
            and user_id = auth.uid() and role in ('owner','staff'))
);

create index if not exists cf_costs_project_idx on cf_job_costs(project_id);

-- ── 5. Membership Manager ──────────────────────────────────
create table if not exists cf_memberships (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id),
  customer_name   text not null,
  customer_email  text,
  customer_phone  text,
  address         text,
  plan            text not null default 'standard'
                    check (plan in ('basic','standard','premium')),
  price_cents     integer default 0,
  start_date      date default current_date,
  renewal_date    date,
  status          text not null default 'active'
                    check (status in ('active','expired','cancelled','pending')),
  notes           text,
  auto_renew      boolean default true,
  created_at      timestamptz default now()
);

alter table cf_memberships enable row level security;
create policy "auth all memberships" on cf_memberships
  for all to authenticated using (true) with check (true);

create index if not exists cf_memberships_owner_idx   on cf_memberships(owner_id);
create index if not exists cf_memberships_status_idx  on cf_memberships(status, renewal_date);
create index if not exists cf_memberships_renewal_idx on cf_memberships(renewal_date);

-- ── 6. Automated Follow-ups ────────────────────────────────
create table if not exists cf_followup_rules (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id),
  trigger      text not null
                 check (trigger in ('estimate_sent','job_complete','membership_expiry','review_request')),
  delay_hours  integer default 24,
  subject      text not null,
  body         text not null,
  active       boolean default true,
  created_at   timestamptz default now()
);

create table if not exists cf_followup_queue (
  id           uuid primary key default gen_random_uuid(),
  rule_id      uuid references cf_followup_rules(id) on delete cascade,
  to_email     text not null,
  to_name      text,
  project_id   uuid references cf_projects(id) on delete set null,
  context      jsonb default '{}',
  scheduled_at timestamptz not null,
  sent_at      timestamptz,
  status       text default 'pending'
                 check (status in ('pending','sent','failed','cancelled')),
  created_at   timestamptz default now()
);

alter table cf_followup_rules enable row level security;
alter table cf_followup_queue enable row level security;

create policy "auth all followup_rules" on cf_followup_rules
  for all to authenticated using (true) with check (true);

create policy "auth all followup_queue" on cf_followup_queue
  for all to authenticated using (true) with check (true);

create index if not exists cf_followup_rules_owner_idx   on cf_followup_rules(owner_id);
create index if not exists cf_followup_queue_status_idx  on cf_followup_queue(status, scheduled_at);
create index if not exists cf_followup_queue_project_idx on cf_followup_queue(project_id);
