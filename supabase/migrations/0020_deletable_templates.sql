-- Tribe Works: allow deleting check-ins/prompts without losing response history
--
-- Samara wants to delete check-ins/prompts outright instead of archiving
-- them. `responses.template_id` was NOT NULL with a plain (restrictive)
-- foreign key, which would have blocked deletion of any template that
-- already had responses. Switching to ON DELETE SET NULL means deleting a
-- template detaches its past responses (they keep their client, answers,
-- and submitted_at) rather than either blocking the delete or destroying
-- client history.

alter table public.responses
  alter column template_id drop not null;

alter table public.responses
  drop constraint if exists responses_template_id_fkey;

alter table public.responses
  add constraint responses_template_id_fkey
  foreign key (template_id) references public.templates(id) on delete set null;

-- response_answers.question_id referenced template_questions with no
-- delete behavior specified (defaults to RESTRICT), which would have
-- blocked deleting a template's questions — and therefore the template
-- itself — the moment any client had answered it. Two fixes:
--
-- 1. Snapshot the question's label onto the answer at submit time, so a
--    client's historical answers stay readable even after the original
--    question/template is deleted.
-- 2. Let question_id go nullable with ON DELETE SET NULL instead of
--    blocking deletion.
alter table public.response_answers
  add column if not exists question_label text;

update public.response_answers ra
set question_label = tq.label
from public.template_questions tq
where ra.question_id = tq.id and ra.question_label is null;

alter table public.response_answers
  alter column question_id drop not null;

alter table public.response_answers
  drop constraint if exists response_answers_question_id_fkey;

alter table public.response_answers
  add constraint response_answers_question_id_fkey
  foreign key (question_id) references public.template_questions(id) on delete set null;
