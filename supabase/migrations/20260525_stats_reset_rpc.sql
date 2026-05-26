-- ============================================================================
-- Stats reset RPC — 2026-05-25
--
-- Adds a SECURITY DEFINER function so admins can zero the /plandesalvacion
-- visit + salvation counters from the admin UI without granting broad
-- UPDATE access on public.stats.
--
-- HOW TO RUN
--   Paste into Supabase SQL Editor and Run. Idempotent.
-- ============================================================================

create or replace function public.reset_salvacion_stats(
  reset_visits     boolean default true,
  reset_salvations boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  yr int := extract(year from now())::int;
begin
  -- Only authenticated callers (admins). auth.uid() is null for anon JWTs.
  if auth.uid() is null then
    raise exception 'Not authorized';
  end if;

  update public.stats
  set
    salvacion_visits     = case when reset_visits     then 0 else salvacion_visits     end,
    salvacion_salvations = case when reset_salvations then 0 else salvacion_salvations end
  where year = yr;

  -- If no row exists for this year yet, insert a zeroed one so the UI shows
  -- 0 / 0 immediately instead of falling back to "no data".
  if not found then
    insert into public.stats (year, salvacion_visits, salvacion_salvations)
    values (yr, 0, 0);
  end if;
end;
$$;

revoke all     on function public.reset_salvacion_stats(boolean, boolean) from public, anon;
grant  execute on function public.reset_salvacion_stats(boolean, boolean) to   authenticated;
