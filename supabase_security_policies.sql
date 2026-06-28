-- 1. Enable Row Level Security (RLS) on all relevant tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts (optional but recommended)
DROP POLICY IF EXISTS "Users can manage their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can manage their own user records" ON public.users;
DROP POLICY IF EXISTS "Users can manage their own estimates" ON public.estimates;

-- 3. Create RLS Policies for full CRUD access (SELECT, INSERT, UPDATE, DELETE)

-- Policy for 'projects' table
CREATE POLICY "Users can manage their own projects"
ON public.projects
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for 'users' table
CREATE POLICY "Users can manage their own user records"
ON public.users
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for 'estimates' table
CREATE POLICY "Users can manage their own estimates"
ON public.estimates
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Note: 
-- 1. `FOR ALL` covers SELECT, INSERT, UPDATE, and DELETE.
-- 2. `TO authenticated` ensures that public/anonymous users cannot access the tables.
-- 3. `USING` filters which rows can be seen or deleted.
-- 4. `WITH CHECK` validates new or modified rows (INSERT/UPDATE).
