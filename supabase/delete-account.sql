-- Lets a signed-in user permanently delete their own account (required by the
-- App Store for any app with sign-up). Run once in Supabase → SQL Editor.
--
-- What it removes:
--   • trips the user organized (and, by cascade, their members, rounds,
--     scores, cup and bets) — those trips disappear for everyone
--   • the user's link to trips they joined (their name and scores stay so
--     friends' leaderboards still add up, but it's no longer tied to them)
--   • the account itself and its profile
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  delete from public.trips where organizer_id = uid;
  update public.trip_members set user_id = null where user_id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
