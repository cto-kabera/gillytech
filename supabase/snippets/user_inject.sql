DO $$
DECLARE
  admin_id uuid := gen_random_uuid();
  teacher_id uuid := gen_random_uuid();
  student_id uuid := gen_random_uuid();
BEGIN
  -- 1. Inject Admin
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@gillytech.dev', crypt('admin123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name": "Admin User", "role": "admin"}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), admin_id, admin_id::text, format('{"sub":"%s","email":"%s"}', admin_id::text, 'admin@gillytech.dev')::jsonb, 'email', now(), now(), now());

  -- 2. Inject Teacher
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (teacher_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher@gillytech.dev', crypt('teacher123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name": "Ms. Achieng Otieno", "role": "teacher"}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), teacher_id, teacher_id::text, format('{"sub":"%s","email":"%s"}', teacher_id::text, 'teacher@gillytech.dev')::jsonb, 'email', now(), now(), now());

  -- 3. Inject Student
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (student_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'amara@gillytech.dev', crypt('student123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name": "Amara Osei", "role": "student"}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), student_id, student_id::text, format('{"sub":"%s","email":"%s"}', student_id::text, 'amara@gillytech.dev')::jsonb, 'email', now(), now(), now());
END $$;