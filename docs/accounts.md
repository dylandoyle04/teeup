# Accounts, invites & live sync (Supabase)

Adds sign-in, shared trips, and real-time scoring on top of the existing app.
Decisions: **magic-link email** sign-in · **shareable invite links** · **guest
mode stays** (you can use the app without an account; signing in unlocks
sharing).

The frontend stays on GitHub Pages / flagstickfinder.com — Supabase is just the
backend it talks to.

## Your one setup task

1. Create a free account at https://supabase.com and click **New project**.
   - Name it `flagstick-finder`, pick a region near your users, set a database
     password (save it somewhere).
2. When it's ready, go to **Project Settings → API** and copy two things:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon public** key (a long string)
3. Send me both. The anon key is safe to share/ship — it's protected by database
   rules, not secrecy.

That's it — once I have those I wire in auth and start moving trips to the cloud.

## Where the keys go

Locally: copy `.env.example` → `.env.local` and fill them in.
Production: they get added to the GitHub Actions build (the anon key is public,
so this is fine).

## Build phases

1. **Auth** — magic-link sign-in screen; guest mode preserved.
2. **Cloud trips** — trips/members move from localStorage to Supabase; create the
   shareable invite-link join flow (`/join/<code>`).
3. **Live scoring** — realtime sync so the scorecard and Ryder Cup update on every
   member's phone as scores are entered.
4. **Polish** — presence, permissions, offline fallback.

## Draft schema (finalized & applied when we wire it up — don't run yet)

```sql
-- users' display profile
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text, color text, created_at timestamptz default now()
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  name text not null, destination text, region text,
  start_date date, end_date date,
  budget_min int, budget_max int, hotel_tier text, needs_flights bool,
  notes text, source_package_id text,
  organizer_id uuid references auth.users,
  invite_code text unique,                       -- powers the invite link
  created_at timestamptz default now()
);

-- members of a trip (a signed-in user, or a placeholder name)
create table trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips on delete cascade,
  user_id uuid references auth.users,            -- null = placeholder
  name text not null, color text, is_organizer bool default false,
  created_at timestamptz default now()
);

create table rounds (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips on delete cascade,
  course_name text, date date, order_index int,
  hole_pars int[], game text, ryder bool default true,
  teams jsonb, wolf jsonb, created_at timestamptz default now()
);

-- one row per (round, member): their 18 strokes + per-hole stats
create table round_scores (
  round_id uuid references rounds on delete cascade,
  member_id uuid references trip_members on delete cascade,
  strokes int[], stats jsonb,
  primary key (round_id, member_id)
);

create table ryder_cup (
  trip_id uuid primary key references trips on delete cascade,
  team_a_name text, team_b_name text, team_of jsonb
);

create table bets (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips on delete cascade,
  description text, from_member uuid, to_member uuid,
  amount numeric, settled bool default false, created_at timestamptz default now()
);
-- + Row Level Security so users only see/edit trips they belong to,
--   and realtime enabled on rounds / round_scores / ryder_cup.
```
