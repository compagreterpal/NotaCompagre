-- Fix Users Table RLS Policy - Nota Perusahaan Web App
-- Run this in Supabase SQL Editor to fix the registration error

-- First, disable RLS temporarily to fix the issue
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Create a simple policy that allows all operations for now
-- This is for development/testing purposes
CREATE POLICY "Allow all operations" ON public.users
    FOR ALL USING (true)
    WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT USAGE ON SEQUENCE public.users_id_seq TO authenticated;

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';

-- Test: Show users table structure (using standard SQL)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
