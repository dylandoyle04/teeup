-- Flagstick Finder — cloud schema (run once in Supabase → SQL Editor → New query).
-- Safe to re-run. Sets up trips, members, rounds, scores, Ryder Cup, bets,
-- with Row Level Security so people only see trips they belong to, plus a
-- join_trip() function powering the invite-link flow, and realtime.

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  color text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);
drop policy if exists "profiles upsert self" on public.profiles;
create policy "profiles upsert self" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles for update using (auth.uid() = id);

-- auto-create a profile row when someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- trips ----------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination text, region text,
  start_date date, end_date date,
  budget_min int, budget_max int,
  hotel_tier text, needs_flights boolean, notes text,
  source_package_id text,
  organizer_id uuid not null references auth.users default auth.uid(),
  invite_code text unique not null default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz default now()
);
alter table public.trips enable row level security;

create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  user_id uuid references auth.users,
  name text not null,
  color text,
  is_organizer boolean default false,
  created_at timestamptz default now(),
  unique (trip_id, user_id)
);
alter table public.trip_members enable row level security;

-- security-definer helpers avoid RLS recursion between trips <-> trip_members
create or replace function public.is_trip_member(tid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.trip_members m
    where m.trip_id = tid and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_trip_organizer(tid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.trips t where t.id = tid and t.organizer_id = auth.uid()
  );
$$;

-- trips policies
drop policy if exists "trips readable by members" on public.trips;
create policy "trips readable by members" on public.trips for select
  using (organizer_id = auth.uid() or public.is_trip_member(id));
drop policy if exists "trips insert own" on public.trips;
create policy "trips insert own" on public.trips for insert with check (organizer_id = auth.uid());
drop policy if exists "trips update organizer" on public.trips;
create policy "trips update organizer" on public.trips for update using (organizer_id = auth.uid());
drop policy if exists "trips delete organizer" on public.trips;
create policy "trips delete organizer" on public.trips for delete using (organizer_id = auth.uid());

-- trip_members policies
drop policy if exists "members readable" on public.trip_members;
create policy "members readable" on public.trip_members for select
  using (user_id = auth.uid() or public.is_trip_member(trip_id));
drop policy if exists "members insert self" on public.trip_members;
create policy "members insert self" on public.trip_members for insert
  with check (user_id = auth.uid() or public.is_trip_organizer(trip_id));
drop policy if exists "members update" on public.trip_members;
create policy "members update" on public.trip_members for update
  using (user_id = auth.uid() or public.is_trip_organizer(trip_id));
drop policy if exists "members delete" on public.trip_members;
create policy "members delete" on public.trip_members for delete
  using (user_id = auth.uid() or public.is_trip_organizer(trip_id));

-- join a trip by its invite code (bypasses RLS via security definer)
create or replace function public.join_trip(code text, display_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare tid uuid;
begin
  select id into tid from public.trips where invite_code = code;
  if tid is null then raise exception 'Trip not found'; end if;
  insert into public.trip_members (trip_id, user_id, name)
  values (tid, auth.uid(), coalesce(nullif(display_name, ''), 'Player'))
  on conflict (trip_id, user_id) do nothing;
  return tid;
end; $$;

-- ---------- rounds / scores ----------
create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  course_name text, date date, order_index int default 0,
  hole_pars int[], game text, ryder boolean default true,
  teams jsonb default '[]'::jsonb, wolf jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);
alter table public.rounds enable row level security;
drop policy if exists "rounds rw members" on public.rounds;
create policy "rounds rw members" on public.rounds for all
  using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));

create table if not exists public.round_scores (
  round_id uuid not null references public.rounds on delete cascade,
  member_id uuid not null references public.trip_members on delete cascade,
  strokes int[], stats jsonb,
  primary key (round_id, member_id)
);
alter table public.round_scores enable row level security;
drop policy if exists "scores rw members" on public.round_scores;
create policy "scores rw members" on public.round_scores for all
  using (public.is_trip_member((select trip_id from public.rounds r where r.id = round_id)))
  with check (public.is_trip_member((select trip_id from public.rounds r where r.id = round_id)));

-- ---------- ryder cup ----------
create table if not exists public.ryder_cup (
  trip_id uuid primary key references public.trips on delete cascade,
  team_a_name text, team_b_name text, team_of jsonb default '{}'::jsonb
);
alter table public.ryder_cup enable row level security;
drop policy if exists "ryder rw members" on public.ryder_cup;
create policy "ryder rw members" on public.ryder_cup for all
  using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));

-- ---------- bets ----------
create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  description text, from_member uuid, to_member uuid,
  amount numeric, settled boolean default false, created_at timestamptz default now()
);
alter table public.bets enable row level security;
drop policy if exists "bets rw members" on public.bets;
create policy "bets rw members" on public.bets for all
  using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));

-- ---------- realtime (idempotent) ----------
do $$
declare t text;
begin
  foreach t in array array['rounds','round_scores','ryder_cup','trip_members','bets','trips'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
