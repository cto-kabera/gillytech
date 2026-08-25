-- Subjects catalog, teacher↔subject assignment, class/question bank FKs.

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create table if not exists public.teacher_subjects (
  teacher_id uuid not null references public.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  primary key (teacher_id, subject_id)
);

alter table public.classes add column if not exists subject_id uuid references public.subjects (id) on delete set null;
alter table public.question_bank add column if not exists subject_id uuid references public.subjects (id) on delete set null;

create index if not exists idx_classes_subject on public.classes (subject_id);
create index if not exists idx_bank_subject on public.question_bank (subject_id);
create index if not exists idx_teacher_subjects_teacher on public.teacher_subjects (teacher_id);

alter table public.subjects enable row level security;
alter table public.teacher_subjects enable row level security;

grant select on public.subjects, public.teacher_subjects to authenticated;

create or replace function public.current_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select school_id from public.users where id = auth.uid();
$$;

drop policy if exists subjects_read on public.subjects;
create policy subjects_read on public.subjects for select to authenticated
  using (school_id = public.current_school_id() or public.app_user_role() = 'admin' or school_id is null);

drop policy if exists teacher_subjects_read on public.teacher_subjects;
create policy teacher_subjects_read on public.teacher_subjects for select to authenticated
  using (teacher_id = auth.uid() or public.app_user_role() = 'admin');

-- Backfill subjects from existing class/bank text
insert into public.subjects (school_id, name)
select distinct school_id, trim(subject)
from public.classes
where subject is not null and trim(subject) <> ''
on conflict (school_id, name) do nothing;

insert into public.subjects (school_id, name)
select distinct u.school_id, trim(qb.subject)
from public.question_bank qb
join public.users u on u.id = qb.teacher_id
where qb.subject is not null and trim(qb.subject) <> ''
on conflict (school_id, name) do nothing;

insert into public.subjects (school_id, name)
select distinct school_id, trim(subject)
from public.users
where role = 'teacher' and subject is not null and trim(subject) <> ''
on conflict (school_id, name) do nothing;

update public.classes c
set subject_id = s.id
from public.subjects s
where c.subject_id is null
  and c.subject is not null
  and s.name = trim(c.subject)
  and (s.school_id is not distinct from c.school_id);

update public.question_bank qb
set subject_id = s.id
from public.users u, public.subjects s
where qb.teacher_id = u.id
  and qb.subject_id is null
  and qb.subject is not null
  and s.name = trim(qb.subject)
  and (s.school_id is not distinct from u.school_id);

insert into public.teacher_subjects (teacher_id, subject_id)
select u.id, s.id
from public.users u
join public.subjects s on s.name = trim(u.subject) and (s.school_id is not distinct from u.school_id)
where u.role = 'teacher' and u.subject is not null
on conflict do nothing;

insert into public.teacher_subjects (teacher_id, subject_id)
select distinct c.teacher_id, c.subject_id
from public.classes c
where c.subject_id is not null
on conflict do nothing;
