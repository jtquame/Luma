-- Tribe Works: split response visibility from answer-content visibility
--
-- Previous migration made the whole response row invisible to the
-- therapist unless shared. That's too strict — Samara should always be
-- able to see THAT a client answered a check-in/prompt (which one, when),
-- just not the actual answer content unless the client shares it.

drop policy if exists responses_select on public.responses;
create policy responses_select on public.responses
  for select using (public.is_therapist() or client_id = auth.uid());

-- The actual content lives in response_answers — THIS is what stays
-- gated behind shared_with_therapist for the therapist.
drop policy if exists response_answers_select on public.response_answers;
create policy response_answers_select on public.response_answers
  for select using (
    exists (
      select 1 from public.responses r
      where r.id = response_id
        and (
          (public.is_therapist() and r.shared_with_therapist = true)
          or r.client_id = auth.uid()
        )
    )
  );
