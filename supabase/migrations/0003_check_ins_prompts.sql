-- Luma: check-ins & prompts (Milestone 4)
--
-- The spec describes CheckInTemplates/CheckInResponses and separate
-- PromptTemplates/PromptResponses, but both are the same shape: a
-- therapist-authored set of structured questions that a client answers.
-- Modeling them as one system with a `kind` discriminator avoids
-- duplicating the question-type logic twice, while `kind` keeps them
-- conceptually and query-wise separate (check-ins are usually recurring;
-- prompts are usually one-off/assigned).

create type template_kind as enum ('check_in', 'prompt');
create type question_type as enum (
  'single_choice',
  'multi_choice',
  'scale',
  'slider',
  'yes_no',
  'short_reflection'
);

-- ---------------------------------------------------------------------------
-- TEMPLATES — therapist-authored, no client can create or edit these.
-- ---------------------------------------------------------------------------
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  kind template_kind not null,
  title text not null,
  description text,
  is_active boolean not null default true,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger templates_touch_updated_at
  before update on public.templates
  for each row execute function public.touch_updated_at();

create index templates_kind_active_idx on public.templates (kind, is_active);

-- ---------------------------------------------------------------------------
-- QUESTIONS — ordered, belongs to a template.
-- ---------------------------------------------------------------------------
create table public.template_questions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  position int not null,
  type question_type not null,
  label text not null,
  -- For single_choice/multi_choice: {"options": ["Not at all", "Slightly", ...]}
  -- For scale: {"min": 1, "max": 5}
  -- For short_reflection: {"max_length": 250}
  -- For yes_no/slider: {} (slider always 0-100 unless overridden: {"min":0,"max":10})
  config jsonb not null default '{}'::jsonb,
  is_required boolean not null default true,
  created_at timestamptz not null default now()
);

create index template_questions_template_idx
  on public.template_questions (template_id, position);

-- ---------------------------------------------------------------------------
-- RESPONSES — one per client per template submission.
-- ---------------------------------------------------------------------------
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id),
  client_id uuid not null references public.users(id),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id)
);

create index responses_template_idx on public.responses (template_id, submitted_at desc);
create index responses_client_idx on public.responses (client_id, submitted_at desc);

-- For check-ins, prevent a client from submitting the same recurring
-- check-in twice on the same calendar day. `submitted_at::date` on its own
-- isn't allowed in an index because that cast depends on the session's
-- timezone setting (not IMMUTABLE); this wrapper fixes the zone to UTC so
-- Postgres can treat it as deterministic.
create or replace function public.date_utc(ts timestamptz)
returns date
language sql
immutable
as $$
  select (ts at time zone 'utc')::date;
$$;

create unique index responses_one_checkin_per_day
  on public.responses (template_id, client_id, public.date_utc(submitted_at));

-- ---------------------------------------------------------------------------
-- ANSWERS — one row per question per response.
-- ---------------------------------------------------------------------------
create table public.response_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.responses(id) on delete cascade,
  question_id uuid not null references public.template_questions(id),
  -- Shape depends on question type: string, string[], number, or boolean,
  -- always wrapped as jsonb so one column covers every type.
  value jsonb not null
);

create index response_answers_response_idx on public.response_answers (response_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.templates enable row level security;
alter table public.template_questions enable row level security;
alter table public.responses enable row level security;
alter table public.response_answers enable row level security;

-- Templates: therapist full access; clients can only read active ones.
create policy templates_select on public.templates
  for select using (public.is_therapist() or is_active);

create policy templates_write_therapist_only on public.templates
  for all using (public.is_therapist()) with check (public.is_therapist());

-- Questions: readable by anyone who can read the parent template; writable
-- by the therapist only.
create policy template_questions_select on public.template_questions
  for select using (
    exists (
      select 1 from public.templates t
      where t.id = template_id and (public.is_therapist() or t.is_active)
    )
  );

create policy template_questions_write_therapist_only on public.template_questions
  for all using (public.is_therapist()) with check (public.is_therapist());

-- Responses: therapist sees all; a client sees and creates only their own,
-- and can never edit/delete a submitted response (data integrity for
-- therapist review).
create policy responses_select on public.responses
  for select using (public.is_therapist() or client_id = auth.uid());

create policy responses_insert_own on public.responses
  for insert with check (client_id = auth.uid());

create policy responses_update_therapist_only on public.responses
  for update using (public.is_therapist());

-- Answers: follow the parent response's visibility; only the owning client
-- can insert answers for their own in-flight submission.
create policy response_answers_select on public.response_answers
  for select using (
    exists (
      select 1 from public.responses r
      where r.id = response_id
        and (public.is_therapist() or r.client_id = auth.uid())
    )
  );

create policy response_answers_insert_own on public.response_answers
  for insert with check (
    exists (
      select 1 from public.responses r
      where r.id = response_id and r.client_id = auth.uid()
    )
  );
