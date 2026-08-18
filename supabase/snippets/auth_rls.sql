-- 1. Sync Supabase Auth to your public.users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name', 
    new.raw_user_meta_data->>'role'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Enable RLS on core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- 3. Write RLS Policies
-- Users can read their own profile, Admins and Teachers can read all profiles
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Teachers and Admins view all users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

-- Teachers manage their own classes; Students view classes they are enrolled in
CREATE POLICY "Teachers manage own classes" ON classes FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Students view enrolled classes" ON classes FOR SELECT USING (
  EXISTS (SELECT 1 FROM enrollments WHERE class_id = classes.id AND student_id = auth.uid())
);

-- Submissions: Students manage their own; Teachers view all
CREATE POLICY "Students manage own submissions" ON submissions FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Teachers view all submissions" ON submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher')
);