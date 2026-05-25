-- ============================================================================
-- Follow-up tracking + sermons table — 2026-05-25 (part 2)
--
-- WHAT THIS DOES
--   1. Adds `needs_follow_up` + `follow_up_at` to form_submissions so admins
--      can flag messages for follow-up and optionally schedule a reminder.
--   2. Creates `sermons` table for admin-managed sermons (video/audio links,
--      speaker, scripture, date).
--   3. RLS: public reads published, non-deleted sermons; authenticated admins
--      can do everything.
--
-- HOW TO RUN
--   Paste this whole file into the Supabase SQL Editor and click Run.
--   Idempotent — safe to re-run.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1.  form_submissions — follow-up columns
-- ────────────────────────────────────────────────────────────────────────────

alter table public.form_submissions
  add column if not exists needs_follow_up  boolean       not null default false,
  add column if not exists follow_up_at     timestamptz;

create index if not exists form_submissions_follow_up_idx
  on public.form_submissions (follow_up_at)
  where needs_follow_up = true and deleted_at is null;

-- ────────────────────────────────────────────────────────────────────────────
-- 2.  sermons — new table
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.sermons (
  id              uuid          primary key default gen_random_uuid(),
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now(),
  created_by      uuid          references auth.users(id) on delete set null,

  title           text          not null,
  speaker         text          not null default '',
  scripture       text          not null default '',
  description     text          not null default '',
  preached_at     date          not null,

  video_url       text          not null default '',
  audio_url       text          not null default '',

  is_published    boolean       not null default true,
  deleted_at      timestamptz
);

create index if not exists sermons_preached_at_idx
  on public.sermons (preached_at desc)
  where deleted_at is null and is_published = true;

drop trigger if exists sermons_touch on public.sermons;
create trigger sermons_touch
  before update on public.sermons
  for each row execute function public.touch_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- 3.  RLS for sermons
-- ────────────────────────────────────────────────────────────────────────────

alter table public.sermons enable row level security;

drop policy if exists "public reads published sermons" on public.sermons;
drop policy if exists "admins manage sermons"          on public.sermons;

create policy "public reads published sermons"
  on public.sermons for select
  to anon, authenticated
  using (is_published = true and deleted_at is null);

create policy "admins manage sermons"
  on public.sermons for all
  to authenticated
  using (true)
  with check (true);
