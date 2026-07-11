-- Tribe Works: custom check-in library
--
-- The "Add from library" panel previously only offered a fixed set of
-- code-defined presets. Samara wants to build and save her own reusable
-- check-ins here too — this table stores those (question shape mirrors
-- template_questions' config format so the same "add to live" logic can
-- reuse it).

create table if not exists public.checkin_library (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  frequency check_in_frequency not null default 'daily',
  questions jsonb not null, -- array of { type, label, isRequired, options?, min?, max?, maxLength? }
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists checkin_library_touch_updated_at on public.checkin_library;
create trigger checkin_library_touch_updated_at
  before update on public.checkin_library
  for each row execute function public.touch_updated_at();

alter table public.checkin_library enable row level security;

drop policy if exists checkin_library_therapist_only on public.checkin_library;
create policy checkin_library_therapist_only on public.checkin_library
  for all using (public.is_therapist()) with check (public.is_therapist());
