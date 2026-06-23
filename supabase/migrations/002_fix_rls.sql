-- Drop the recursive policies
drop policy if exists "owners can manage members" on loc_members;
drop policy if exists "owners can manage locs" on locs;
drop policy if exists "owners can manage transactions" on transactions;

-- Create a security definer function to check membership without triggering RLS
create or replace function is_loc_member(p_loc_id uuid, p_user_id uuid, p_role text default null)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from loc_members
    where loc_id = p_loc_id
      and user_id = p_user_id
      and (p_role is null or role = p_role)
  );
$$;

-- Recreate policies using the function instead of subqueries
create policy "owners can manage locs"
  on locs for all
  using (is_loc_member(locs.id, auth.uid(), 'owner'));

create policy "owners can manage transactions"
  on transactions for all
  using (is_loc_member(transactions.loc_id, auth.uid(), 'owner'));

create policy "owners can manage members"
  on loc_members for all
  using (is_loc_member(loc_members.loc_id, auth.uid(), 'owner'));
