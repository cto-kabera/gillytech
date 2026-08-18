-- 1. Dynamically find and drop all existing policies on the users table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
    END LOOP;
END $$;

-- 2. Ensure RLS is still enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create a clean, safe policy that does NOT query the table itself
CREATE POLICY "Allow authenticated users to read profiles" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (true);