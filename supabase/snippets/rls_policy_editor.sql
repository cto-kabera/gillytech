-- Ensure RLS is enabled on the table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to read the users table
CREATE POLICY "Allow logged-in users to read profiles" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (true);