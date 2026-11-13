-- F-HIST snapshots + F-SUB-07 timing storage. question_shown_at is the F-SES-05 server anchor.

alter table public.sessions
  add column if not exists current_question_shown_at timestamptz;

alter table public.submissions
  add column if not exists question_text text,
  add column if not exists options_json jsonb,
  add column if not exists correct_answer_snapshot text,
  add column if not exists timing jsonb,
  add column if not exists feedback text;

create index if not exists idx_submissions_student_created
  on public.submissions (student_id, created_at desc);

comment on column public.submissions.timing is 'F-SUB-07 StoredTiming JSON; observational client marks, server-authoritative anchors';
comment on column public.submissions.feedback is 'ADR-004 AI reasoning feedback; null until that feature ships';
