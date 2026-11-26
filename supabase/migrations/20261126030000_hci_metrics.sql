-- Stage-specific HCI measurables (workflow stages 1–4) + SEQ micro-surveys.

alter table public.submissions
  add column if not exists hci jsonb;

create table if not exists public.hci_surveys (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  question_id uuid references public.questions (id) on delete set null,
  student_id uuid not null references public.users (id) on delete cascade,
  seq_score int not null check (seq_score between 1 and 7),
  stage text not null default 'post_round' check (stage in ('post_round', 'session_end')),
  created_at timestamptz not null default now()
);

create index if not exists idx_hci_surveys_session on public.hci_surveys (session_id);
create index if not exists idx_submissions_hci on public.submissions ((hci is not null)) where hci is not null;

comment on column public.submissions.hci is 'HCI workflow metrics by stage (pre-reasoning, discussion, submit, derived alignment)';