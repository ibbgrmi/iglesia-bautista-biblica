-- ============================================================================
-- Prayer requests — 2026-05-26
--
-- WHAT THIS DOES
--   1. Adds `next_prayer_service(d timestamptz)` helper — returns the date of
--      the Wednesday service that a submission at `d` should be read at.
--      Rule: Thursday→Wednesday window with a 19:00 America/New_York cutoff
--      on Wed itself (after 7 PM rolls to next Wed).
--   2. Creates `prayer_requests` table for the new /peticion flow.
--   3. RLS: public can INSERT (the form); authenticated admins can do anything.
--
-- HOW TO RUN
--   Paste into Supabase SQL Editor and Run. Idempotent.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. next_prayer_service() — assign a submission to the right Wed service
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.next_prayer_service(d timestamptz default now())
returns date
language plpgsql
immutable
as $$
declare
  local_d   timestamp := d at time zone 'America/New_York';
  local_dt  date      := local_d::date;
  dow       int       := extract(isodow from local_dt)::int;  -- Mon=1..Sun=7
  delta     int;
begin
  case
    when dow < 3 then
      delta := 3 - dow;                              -- Mon, Tue → this Wed
    when dow = 3 then
      if extract(hour from local_d) < 19 then
        delta := 0;                                  -- Wed before 7 PM → today
      else
        delta := 7;                                  -- Wed after 7 PM → next Wed
      end if;
    else
      delta := 10 - dow;                             -- Thu–Sun → next Wed
  end case;
  return local_dt + delta;
end $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. prayer_requests table
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.prayer_requests (
  id              uuid          primary key default gen_random_uuid(),
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now(),

  name            text          not null default '',
  is_anonymous    boolean       not null default false,
  petition        text          not null,
  email           text          not null default '',
  phone           text          not null default '',

  source          text          not null default 'web'
    check (source in ('web', 'whatsapp', 'phone', 'in-person', 'email', 'other')),

  service_date    date          not null default public.next_prayer_service(),

  is_answered     boolean       not null default false,
  answered_at     timestamptz,
  answered_notes  text          not null default '',

  is_archived     boolean       not null default false,
  archived_at     timestamptz,

  entered_by      uuid          references auth.users(id) on delete set null,

  printed_at      timestamptz,
  print_count     int           not null default 0,

  deleted_at      timestamptz
);

create index if not exists prayer_requests_service_date_idx
  on public.prayer_requests (service_date)
  where deleted_at is null;

create index if not exists prayer_requests_created_at_idx
  on public.prayer_requests (created_at desc);

create index if not exists prayer_requests_open_idx
  on public.prayer_requests (service_date)
  where deleted_at is null and is_archived = false and is_answered = false;

drop trigger if exists prayer_requests_touch on public.prayer_requests;
create trigger prayer_requests_touch
  before update on public.prayer_requests
  for each row execute function public.touch_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Grants + RLS
--
-- Important: anon must NOT have SELECT (would let anyone read all prayers).
-- For anon INSERT to succeed, the client must use Prefer: return=minimal
-- so PostgREST doesn't run a hidden SELECT for the RETURNING clause.
-- Our src/supabase.ts dbInsert() does that.
-- ────────────────────────────────────────────────────────────────────────────

revoke all   on public.prayer_requests from anon;
grant  insert on public.prayer_requests to   anon;
grant  select, insert, update, delete on public.prayer_requests to authenticated;

alter table public.prayer_requests enable row level security;

drop policy if exists "public can submit prayers" on public.prayer_requests;
drop policy if exists "admins read prayers"       on public.prayer_requests;
drop policy if exists "admins update prayers"     on public.prayer_requests;
drop policy if exists "admins delete prayers"     on public.prayer_requests;

create policy "public can submit prayers"
  on public.prayer_requests for insert
  to anon, authenticated
  with check (true);

create policy "admins read prayers"
  on public.prayer_requests for select
  to authenticated
  using (true);

create policy "admins update prayers"
  on public.prayer_requests for update
  to authenticated
  using (true) with check (true);

create policy "admins delete prayers"
  on public.prayer_requests for delete
  to authenticated
  using (true);
