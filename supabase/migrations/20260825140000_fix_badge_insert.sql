-- Align submit_reasoned_answer with public.badges (no question_id column).
-- An earlier function body inserted badges.question_id, which this table never had.

create or replace function public.submit_reasoned_answer(
  p_session_id uuid,
  p_question_id uuid,
  p_student_id uuid,
  p_group_id uuid,
  p_reasoning text,
  p_answer text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  q public.questions%rowtype;
  sess public.sessions%rowtype;
  v_is_correct boolean;
  v_first boolean;
  v_score int := 0;
  v_sub public.submissions%rowtype;
begin
  select * into sess from public.sessions where id = p_session_id;
  if not found then
    raise exception 'Session not found';
  end if;
  if sess.status is distinct from 'active' then
    raise exception 'Session is not active';
  end if;

  select * into q from public.questions where id = p_question_id and session_id = p_session_id for update;
  if not found then
    raise exception 'Question not found';
  end if;

  if exists (
    select 1 from public.submissions
    where question_id = p_question_id and student_id = p_student_id
  ) then
    raise exception 'Already submitted';
  end if;

  if length(trim(coalesce(p_reasoning, ''))) < 21 then
    raise exception 'Reasoning too short';
  end if;

  v_is_correct := (trim(p_answer) = trim(q.correct_answer));
  v_first := v_is_correct and not exists (
    select 1 from public.submissions
    where question_id = p_question_id and is_correct = true
  );

  if v_is_correct then v_score := v_score + 8; end if;
  if v_first then v_score := v_score + 2; end if;
  if length(trim(p_reasoning)) > 20 then v_score := v_score + 2; end if;

  insert into public.submissions (
    session_id, question_id, student_id, group_id,
    reasoning_text, answer, is_correct, is_first_correct, score
  ) values (
    p_session_id, p_question_id, p_student_id, p_group_id,
    p_reasoning, p_answer, v_is_correct, v_first, v_score
  )
  returning * into v_sub;

  if v_first then
    insert into public.badges (student_id, session_id, badge_type)
    values (p_student_id, p_session_id, 'first_correct');
  end if;

  return jsonb_build_object(
    'submission', to_jsonb(v_sub),
    'correct_answer', q.correct_answer,
    'is_correct', v_is_correct,
    'is_first_correct', v_first,
    'score', v_score,
    'options', q.content_json -> 'options'
  );
end;
$$;
