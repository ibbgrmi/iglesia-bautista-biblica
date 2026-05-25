-- ============================================================================
-- Admin panel upgrade — 2026-05-25
--
-- WHAT THIS DOES
--   1. Extends `form_submissions` with status, star, internal notes,
--      soft-delete, read/responded timestamps.
--   2. Adds a `calendar_events` table for the new admin-managed calendar.
--   3. Wires RLS so authenticated admins can read/write everything, and the
--      public can only read published, non-deleted calendar events.
--
-- HOW TO RUN
--   Paste this whole file into the Supabase SQL Editor (Dashboard ▸ SQL Editor
--   ▸ + New query), then click Run. It is idempotent — re-running is safe.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1.  form_submissions — new columns
-- ────────────────────────────────────────────────────────────────────────────

alter table public.form_submissions
  add column if not exists status         text          not null default 'new'
    check (status in ('new', 'in_progress', 'responded', 'archived')),
  add column if not exists is_starred     boolean       not null default false,
  add column if not exists admin_notes    text          not null default '',
  add column if not exists read_at        timestamptz,
  add column if not exists read_by        uuid          references auth.users(id) on delete set null,
  add column if not exists responded_at   timestamptz,
  add column if not exists responded_by   uuid          references auth.users(id) on delete set null,
  add column if not exists deleted_at     timestamptz;

-- Filter the most common queries fast.
create index if not exists form_submissions_status_idx
  on public.form_submissions (status)
  where deleted_at is null;

create index if not exists form_submissions_created_at_idx
  on public.form_submissions (created_at desc);

-- ────────────────────────────────────────────────────────────────────────────
-- 2.  calendar_events — new table
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.calendar_events (
  id              uuid          primary key default gen_random_uuid(),
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now(),
  created_by      uuid          references auth.users(id) on delete set null,

  title           text          not null,
  description     text          not null default '',
  location        text          not null default '',
  starts_at       timestamptz   not null,
  ends_at         timestamptz,
  all_day         boolean       not null default false,

  -- Simple recurrence support — extend later if needed.
  -- 'none'    = single event
  -- 'weekly'  = repeats every week on the same weekday at the same time
  recurrence     text           not null default 'none'
    check (recurrence in ('none', 'weekly')),

  is_published    boolean       not null default true,
  deleted_at      timestamptz,

  check (ends_at is null or ends_at >= starts_at)
);

create index if not exists calendar_events_starts_at_idx
  on public.calendar_events (starts_at)
  where deleted_at is null and is_published = true;

-- Keep updated_at fresh on every row update.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists calendar_events_touch on public.calendar_events;
create trigger calendar_events_touch
  before update on public.calendar_events
  for each row execute function public.touch_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- 3.  Row-level security
-- ────────────────────────────────────────────────────────────────────────────

alter table public.form_submissions enable row level security;
alter table public.calendar_events  enable row level security;

-- form_submissions: public can INSERT (the contact form); only authenticated
-- admins can SELECT / UPDATE / DELETE.  Existing INSERT policy from the form
-- wiring is left untouched.
drop policy if exists "admins read submissions"   on public.form_submissions;
drop policy if exists "admins update submissions" on public.form_submissions;
drop policy if exists "admins delete submissions" on public.form_submissions;

create policy "admins read submissions"
  on public.form_submissions for select
  to authenticated
  using (true);

create policy "admins update submissions"
  on public.form_submissions for update
  to authenticated
  using (true)
  with check (true);

create policy "admins delete submissions"
  on public.form_submissions for delete
  to authenticated
  using (true);

-- calendar_events: public can READ published, non-deleted events.
-- Authenticated admins can do anything.
drop policy if exists "public reads published events" on public.calendar_events;
drop policy if exists "admins manage events"         on public.calendar_events;

create policy "public reads published events"
  on public.calendar_events for select
  to anon, authenticated
  using (is_published = true and deleted_at is null);

create policy "admins manage events"
  on public.calendar_events for all
  to authenticated
  using (true)
  with check (true);
