-- Gillytech MVP schema: Supabase Auth sync, Postgres, RLS, Realtime.
-- Applied via `supabase db push` (local or GitHub Actions). Do not paste piecemeal.

-- gen_random_uuid() is already available on Supabase (do not CREATE EXTENSION pgcrypto).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text default 'Kenya',
  city text,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  school_id uuid references public.schools (id) on delete set null,
  name text not null,
  email text not null unique,
  role text not null check (role in ('student', 'teacher', 'admin')),
  avatar text,
  subject text,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.users (id) on delete cascade,
  school_id uuid references public.schools (id) on delete set null,
  name text not null,
  grade_level text,
  subject text,
  join_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  teacher_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed')),
  current_question_index int not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  name text not null,
  formed_by text default 'auto',
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  student_id uuid not null references public.users (id) on delete cascade,
  unique (group_id, student_id)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  order_index int not null default 0,
  type text not null default 'multiple_choice',
  marks int not null default 10,
  time_limit_sec int default 120,
  content_json jsonb not null default '{}'::jsonb,
  correct_answer text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.question_bank (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.users (id) on delete cascade,
  subject text,
  topic text,
  type text not null default 'multiple_choice',
  marks int not null default 10,
  content_json jsonb not null default '{}'::jsonb,
  correct_answer text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  student_id uuid not null references public.users (id) on delete cascade,
  group_id uuid references public.groups (id) on delete set null,
  reasoning_text text not null default '',
  answer text not null,
  is_correct boolean not null default false,
  is_first_correct boolean not null default false,
  score int not null default 0,
  created_at timestamptz not null default now(),
  unique (question_id, student_id)
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete set null,
  badge_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  question_id uuid references public.questions (id) on delete set null,
  sender_id uuid not null references public.users (id) on delete cascade,
  sender_name text,
  message text not null,
  sent_at timestamptz not null default now()
);

create index if not exists idx_classes_teacher on public.classes (teacher_id);
create index if not exists idx_enrollments_class on public.enrollments (class_id);
create index if not exists idx_sessions_class on public.sessions (class_id);
create index if not exists idx_groups_session on public.groups (session_id);
create index if not exists idx_group_members_student on public.group_members (student_id);
create index if not exists idx_questions_session on public.questions (session_id);
create index if not exists idx_submissions_session on public.submissions (session_id);
create index if not exists idx_chat_group on public.chat_messages (group_id);
create index if not exists idx_chat_session on public.chat_messages (session_id);

-- ---------------------------------------------------------------------------
-- Auth → public.users sync
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
  initials text;
begin
  display_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  initials := upper(left(regexp_replace(display_name, '[^A-Za-z]', '', 'g'), 2));
  if initials is null or initials = '' then
    initials := upper(left(split_part(new.email, '@', 1), 2));
  end if;

  insert into public.users (id, email, name, role, avatar, subject)
  values (
    new.id,
    new.email,
    display_name,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    initials,
    new.raw_user_meta_data->>'subject'
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role,
    avatar = excluded.avatar,
    subject = excluded.subject;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trusted scoring (service_role only)
-- ---------------------------------------------------------------------------

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

  select * into q from public.questions where id = p_question_id and session_id = p_session_id;
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

revoke all on function public.submit_reasoned_answer(uuid, uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.submit_reasoned_answer(uuid, uuid, uuid, uuid, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------

create or replace function public.app_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.is_session_teacher(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.sessions s
    where s.id = p_session_id and s.teacher_id = auth.uid()
  )
$$;

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.student_id = auth.uid()
  )
$$;

create or replace function public.is_enrolled_in_session(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sessions s
    join public.enrollments e on e.class_id = s.class_id
    where s.id = p_session_id and e.student_id = auth.uid()
  )
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- Direct client access is read-only and scoped. Writes go through Express
-- (service_role bypasses RLS).
-- ---------------------------------------------------------------------------

alter table public.schools enable row level security;
alter table public.users enable row level security;
alter table public.classes enable row level security;
alter table public.enrollments enable row level security;
alter table public.sessions enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.questions enable row level security;
alter table public.question_bank enable row level security;
alter table public.submissions enable row level security;
alter table public.badges enable row level security;
alter table public.chat_messages enable row level security;

grant usage on schema public to authenticated, anon, service_role;
grant select on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

drop policy if exists schools_read on public.schools;
create policy schools_read on public.schools for select to authenticated
  using (true);

drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users for select to authenticated
  using (id = auth.uid() or public.app_user_role() in ('teacher', 'admin'));

drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes for select to authenticated
  using (
    teacher_id = auth.uid()
    or public.app_user_role() = 'admin'
    or exists (select 1 from public.enrollments e where e.class_id = classes.id and e.student_id = auth.uid())
  );

drop policy if exists enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments for select to authenticated
  using (
    student_id = auth.uid()
    or public.app_user_role() = 'admin'
    or exists (select 1 from public.classes c where c.id = enrollments.class_id and c.teacher_id = auth.uid())
  );

drop policy if exists sessions_select on public.sessions;
create policy sessions_select on public.sessions for select to authenticated
  using (
    teacher_id = auth.uid()
    or public.app_user_role() = 'admin'
    or public.is_enrolled_in_session(id)
  );

drop policy if exists groups_select on public.groups;
create policy groups_select on public.groups for select to authenticated
  using (
    public.is_session_teacher(session_id)
    or public.app_user_role() = 'admin'
    or public.is_group_member(id)
  );

drop policy if exists group_members_select on public.group_members;
create policy group_members_select on public.group_members for select to authenticated
  using (
    student_id = auth.uid()
    or public.app_user_role() = 'admin'
    or exists (
      select 1 from public.groups g
      where g.id = group_members.group_id and public.is_session_teacher(g.session_id)
    )
    or exists (
      select 1 from public.group_members me
      where me.group_id = group_members.group_id and me.student_id = auth.uid()
    )
  );

-- Students never read questions via the client (answer key lives here).
drop policy if exists questions_select_staff on public.questions;
create policy questions_select_staff on public.questions for select to authenticated
  using (public.is_session_teacher(session_id) or public.app_user_role() = 'admin');

drop policy if exists question_bank_select on public.question_bank;
create policy question_bank_select on public.question_bank for select to authenticated
  using (teacher_id = auth.uid() or public.app_user_role() = 'admin');

drop policy if exists submissions_select on public.submissions;
create policy submissions_select on public.submissions for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_session_teacher(session_id)
    or public.app_user_role() = 'admin'
  );

drop policy if exists badges_select on public.badges;
create policy badges_select on public.badges for select to authenticated
  using (student_id = auth.uid() or public.app_user_role() in ('teacher', 'admin'));

drop policy if exists chat_select on public.chat_messages;
create policy chat_select on public.chat_messages for select to authenticated
  using (
    public.is_group_member(group_id)
    or public.is_session_teacher(session_id)
    or public.app_user_role() = 'admin'
  );

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter table public.sessions replica identity full;
alter table public.chat_messages replica identity full;
alter table public.submissions replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.sessions;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.chat_messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.submissions;
  exception when duplicate_object then null;
  end;
end $$;
