-- Lines of Credit
create table locs (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  borrower_name text not null,
  lender_name   text not null,
  ceiling_cents bigint not null default 27500000, -- $275,000 default
  apr           numeric(6,4) not null default 0.15,
  start_date    date not null default current_date,
  notes         text,
  created_at    timestamptz default now()
);

-- Transactions (draws and payments)
create table transactions (
  id         uuid primary key default gen_random_uuid(),
  loc_id     uuid not null references locs(id) on delete cascade,
  type       text not null check (type in ('draw', 'payment')),
  amount_cents bigint not null,
  date       date not null,
  note       text,
  created_at timestamptz default now()
);

-- LOC membership (who can access which LOC, at what role)
create table loc_members (
  id      uuid primary key default gen_random_uuid(),
  loc_id  uuid not null references locs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role    text not null check (role in ('owner', 'viewer')),
  unique (loc_id, user_id)
);

-- RLS
alter table locs enable row level security;
alter table transactions enable row level security;
alter table loc_members enable row level security;

-- Users can see LOCs they are members of
create policy "members can view locs"
  on locs for select
  using (
    exists (
      select 1 from loc_members
      where loc_members.loc_id = locs.id
        and loc_members.user_id = auth.uid()
    )
  );

-- Owners can insert/update/delete LOCs
create policy "owners can manage locs"
  on locs for all
  using (
    exists (
      select 1 from loc_members
      where loc_members.loc_id = locs.id
        and loc_members.user_id = auth.uid()
        and loc_members.role = 'owner'
    )
  );

-- Members can view transactions for their LOCs
create policy "members can view transactions"
  on transactions for select
  using (
    exists (
      select 1 from loc_members
      where loc_members.loc_id = transactions.loc_id
        and loc_members.user_id = auth.uid()
    )
  );

-- Owners can manage transactions
create policy "owners can manage transactions"
  on transactions for all
  using (
    exists (
      select 1 from loc_members
      where loc_members.loc_id = transactions.loc_id
        and loc_members.user_id = auth.uid()
        and loc_members.role = 'owner'
    )
  );

-- Members can view their own memberships
create policy "members can view loc_members"
  on loc_members for select
  using (user_id = auth.uid());

-- Owners can manage members of their LOCs
create policy "owners can manage members"
  on loc_members for all
  using (
    exists (
      select 1 from loc_members lm2
      where lm2.loc_id = loc_members.loc_id
        and lm2.user_id = auth.uid()
        and lm2.role = 'owner'
    )
  );

-- Index for fast lookups
create index on transactions(loc_id, date);
create index on loc_members(user_id);
create index on loc_members(loc_id);
