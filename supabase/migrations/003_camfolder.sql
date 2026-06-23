-- CamFolder: Job site projects
create table if not exists cf_projects (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  address     text,
  trade       text,
  status      text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at  timestamptz default now()
);

-- Photos per project
create table if not exists cf_photos (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references cf_projects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  storage_url text not null,
  note        text,
  gps_lat     numeric(10,7),
  gps_lng     numeric(10,7),
  taken_at    timestamptz default now()
);

-- AI-generated daily logs
create table if not exists cf_daily_logs (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references cf_projects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  log_date    date not null default current_date,
  content     text not null,
  raw_notes   text,
  created_at  timestamptz default now(),
  unique (project_id, log_date)
);

-- CamFolder project membership
create table if not exists cf_project_members (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references cf_projects(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('owner', 'staff', 'viewer')),
  unique (project_id, user_id)
);

-- RLS
alter table cf_projects enable row level security;
alter table cf_photos enable row level security;
alter table cf_daily_logs enable row level security;
alter table cf_project_members enable row level security;

-- cf_project_members policies
create policy "members can view cf_project_members"
  on cf_project_members for select using (user_id = auth.uid());

create policy "owners can manage cf_project_members"
  on cf_project_members for all using (
    exists (select 1 from cf_project_members m
      where m.project_id = cf_project_members.project_id
        and m.user_id = auth.uid() and m.role = 'owner')
  );

-- cf_projects policies
create policy "members can view projects" on cf_projects for select using (
  exists (select 1 from cf_project_members where project_id = cf_projects.id and user_id = auth.uid())
);
create policy "owners can manage projects" on cf_projects for all using (owner_id = auth.uid());

-- cf_photos policies
create policy "members can view photos" on cf_photos for select using (
  exists (select 1 from cf_project_members where project_id = cf_photos.project_id and user_id = auth.uid())
);
create policy "staff and owners can add photos" on cf_photos for insert with check (
  exists (select 1 from cf_project_members where project_id = cf_photos.project_id and user_id = auth.uid() and role in ('owner','staff'))
);
create policy "can delete own photos" on cf_photos for delete using (user_id = auth.uid());

-- cf_daily_logs policies
create policy "members can view logs" on cf_daily_logs for select using (
  exists (select 1 from cf_project_members where project_id = cf_daily_logs.project_id and user_id = auth.uid())
);
create policy "staff and owners can manage logs" on cf_daily_logs for all using (
  exists (select 1 from cf_project_members where project_id = cf_daily_logs.project_id and user_id = auth.uid() and role in ('owner','staff'))
);

-- Indexes
create index if not exists cf_photos_project_idx on cf_photos(project_id, taken_at);
create index if not exists cf_logs_project_idx on cf_daily_logs(project_id, log_date);
create index if not exists cf_projects_owner_idx on cf_projects(owner_id);
create index if not exists cf_members_project_idx on cf_project_members(project_id);
create index if not exists cf_members_user_idx on cf_project_members(user_id);
