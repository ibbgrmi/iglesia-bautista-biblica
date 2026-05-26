-- ============================================================================
-- Contact messages — 2026-05-26
--
-- General contact form on /contacto. Separate from form_submissions (which is
-- the /plandesalvacion form with gospel-specific fields) and prayer_requests
-- (which is /peticion). One inbox per intent, simpler admin views.
--
-- HOW TO RUN
--   Paste into Supabase SQL Editor and Run. Idempotent.
-- ============================================================================

create table if not exists public.contact_messages (
  id              uuid          primary key default gen_random_uuid(),
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now(),

  name            text          not null,
  email           text          not null default '',
  phone           text          not null default '',

  -- What is this message about?
  reason          text          not null default 'general'
    check (reason in ('pastoral', 'general', 'visit', 'volunteer', 'other')),

  message         text          not null,

  source          text          not null default 'web'
    check (source in ('web', 'phone', 'in-person', 'email', 'other')),

  status          text          not null default 'new'
    check (status in ('new', 'in_progress', 'responded', 'archived')),
  is_starred      boolean       not null default false,
  admin_notes     text          not null default '',
  read_at         timestamptz,
  read_by         uuid          references auth.users(id) on delete set null,
  responded_at    timestamptz,
  responded_by    uuid          references auth.users(id) on delete set null,
  needs_follow_up boolean       not null default false,
  follow_up_at    timestamptz,

  deleted_at      timestamptz
);

create index if not exists contact_messages_status_idx
  on public.contact_messages (status)
  where deleted_at is null;
create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

drop trigger if exists contact_messages_touch on public.contact_messages;
create trigger contact_messages_touch
  before update on public.contact_messages
  for each row execute function public.touch_updated_at();

-- RLS
alter table public.contact_messages enable row level security;

drop policy if exists "public can submit contact"  on public.contact_messages;
drop policy if exists "admins read contact"        on public.contact_messages;
drop policy if exists "admins update contact"      on public.contact_messages;
drop policy if exists "admins delete contact"      on public.contact_messages;

create policy "public can submit contact"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

create policy "admins read contact"
  on public.contact_messages for select
  to authenticated
  using (true);

create policy "admins update contact"
  on public.contact_messages for update
  to authenticated
  using (true) with check (true);

create policy "admins delete contact"
  on public.contact_messages for delete
  to authenticated
  using (true);
