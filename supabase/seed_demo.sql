-- Paste into Supabase Dashboard → SQL Editor → Run (new project).
-- Demo logins:
--   admin@gillytech.dev   / admin123
--   teacher@gillytech.dev / teacher123
--   amara@gillytech.dev   / student123
-- Join code: BIO-2024

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  v_inst uuid;
  v_school_id uuid;
  v_bio_id uuid;
  v_class_id uuid;
  v_teacher_id uuid;
  v_admin_id uuid;
begin
  select i.id into v_inst from auth.instances i limit 1;
  if v_inst is null then
    v_inst := '00000000-0000-0000-0000-000000000000';
  end if;

  -- Auth users (trigger fills public.users)
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  select
    v_inst,
    v.id,
    'authenticated',
    'authenticated',
    v.email,
    extensions.crypt(v.password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    v.meta,
    now(),
    now(),
    '',
    '',
    '',
    ''
  from (
    values
      (
        'a1000000-0000-4000-8000-000000000001'::uuid,
        'admin@gillytech.dev',
        'admin123',
        '{"name":"Admin User","role":"admin"}'::jsonb
      ),
      (
        'a1000000-0000-4000-8000-000000000002'::uuid,
        'teacher@gillytech.dev',
        'teacher123',
        '{"name":"Ms. Achieng Otieno","role":"teacher","subject":"Biology"}'::jsonb
      ),
      (
        'a1000000-0000-4000-8000-000000000003'::uuid,
        'amara@gillytech.dev',
        'student123',
        '{"name":"Amara Osei","role":"student"}'::jsonb
      ),
      (
        'a1000000-0000-4000-8000-000000000004'::uuid,
        'brian@gillytech.dev',
        'student123',
        '{"name":"Brian Mwangi","role":"student"}'::jsonb
      ),
      (
        'a1000000-0000-4000-8000-000000000005'::uuid,
        'cynthia@gillytech.dev',
        'student123',
        '{"name":"Cynthia Wanjiku","role":"student"}'::jsonb
      ),
      (
        'a1000000-0000-4000-8000-000000000006'::uuid,
        'david@gillytech.dev',
        'student123',
        '{"name":"David Otieno","role":"student"}'::jsonb
      ),
      (
        'a1000000-0000-4000-8000-000000000007'::uuid,
        'esther@gillytech.dev',
        'student123',
        '{"name":"Esther Akinyi","role":"student"}'::jsonb
      ),
      (
        'a1000000-0000-4000-8000-000000000008'::uuid,
        'felix@gillytech.dev',
        'student123',
        '{"name":"Felix Kamau","role":"student"}'::jsonb
      )
  ) as v(id, email, password, meta)
  where not exists (select 1 from auth.users u where u.email = v.email);

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  select
    gen_random_uuid(),
    u.id,
    jsonb_build_object('sub', u.id::text, 'email', u.email),
    'email',
    u.id::text,
    now(),
    now(),
    now()
  from auth.users u
  where u.email in (
    'admin@gillytech.dev',
    'teacher@gillytech.dev',
    'amara@gillytech.dev',
    'brian@gillytech.dev',
    'cynthia@gillytech.dev',
    'david@gillytech.dev',
    'esther@gillytech.dev',
    'felix@gillytech.dev'
  )
  and not exists (
    select 1 from auth.identities i
    where i.user_id = u.id and i.provider = 'email'
  );

  -- If the user already existed in Auth but public.users was missing
  insert into public.users (id, email, name, role, avatar, subject)
  select
    u.id,
    u.email,
    coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
    coalesce(u.raw_user_meta_data->>'role', 'student'),
    upper(left(regexp_replace(coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)), '[^A-Za-z]', '', 'g'), 2)),
    u.raw_user_meta_data->>'subject'
  from auth.users u
  where u.email in (
    'admin@gillytech.dev',
    'teacher@gillytech.dev',
    'amara@gillytech.dev',
    'brian@gillytech.dev',
    'cynthia@gillytech.dev',
    'david@gillytech.dev',
    'esther@gillytech.dev',
    'felix@gillytech.dev'
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role,
    subject = excluded.subject;

  insert into public.schools (name, country, city)
  select 'Nairobi STEM Academy', 'Kenya', 'Nairobi'
  where not exists (select 1 from public.schools s where s.name = 'Nairobi STEM Academy');

  select s.id into v_school_id from public.schools s where s.name = 'Nairobi STEM Academy' limit 1;
  select u.id into v_admin_id from public.users u where u.email = 'admin@gillytech.dev';
  select u.id into v_teacher_id from public.users u where u.email = 'teacher@gillytech.dev';

  if v_admin_id is null or v_teacher_id is null then
    raise exception 'Demo auth users missing after insert';
  end if;

  update public.users
  set school_id = v_school_id
  where email in (
    'admin@gillytech.dev',
    'teacher@gillytech.dev',
    'amara@gillytech.dev',
    'brian@gillytech.dev',
    'cynthia@gillytech.dev',
    'david@gillytech.dev',
    'esther@gillytech.dev',
    'felix@gillytech.dev'
  );

  insert into public.subjects (school_id, name)
  values (v_school_id, 'Biology')
  on conflict (school_id, name) do nothing;

  select s.id into v_bio_id
  from public.subjects s
  where s.school_id = v_school_id and s.name = 'Biology';

  insert into public.teacher_subjects (teacher_id, subject_id)
  values (v_teacher_id, v_bio_id)
  on conflict do nothing;

  insert into public.classes (
    teacher_id, school_id, name, grade_level, subject, subject_id, join_code
  )
  select v_teacher_id, v_school_id, 'Form 3 Biology', 'Grade 10', 'Biology', v_bio_id, 'BIO-2024'
  where not exists (select 1 from public.classes c where c.join_code = 'BIO-2024');

  select c.id into v_class_id from public.classes c where c.join_code = 'BIO-2024';

  update public.classes
  set subject_id = v_bio_id, subject = 'Biology', teacher_id = v_teacher_id, school_id = v_school_id
  where id = v_class_id;

  insert into public.enrollments (class_id, student_id)
  select v_class_id, u.id
  from public.users u
  where u.email in (
    'amara@gillytech.dev',
    'brian@gillytech.dev',
    'cynthia@gillytech.dev',
    'david@gillytech.dev',
    'esther@gillytech.dev',
    'felix@gillytech.dev'
  )
  on conflict (class_id, student_id) do nothing;

  insert into public.question_bank (
    teacher_id, subject, subject_id, topic, type, marks, content_json, correct_answer
  )
  select
    v_teacher_id,
    'Biology',
    v_bio_id,
    'Photosynthesis',
    'multiple_choice',
    10,
    '{"text":"Which organelle is the primary site of photosynthesis in plant cells?","options":["Mitochondrion","Chloroplast","Nucleus","Ribosome"]}'::jsonb,
    '1'
  where not exists (
    select 1 from public.question_bank qb where qb.teacher_id = v_teacher_id
  );
end $$;
