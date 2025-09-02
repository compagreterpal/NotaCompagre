-- Setup Users Table for Nota Perusahaan Web App
-- Run this in Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster login
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can insert their own data (for registration)
CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (true);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Create a default admin user (password: admin123)
-- Note: This is just for testing, change the password in production
INSERT INTO public.users (full_name, username, email, password) 
VALUES (
    'Administrator', 
    'admin', 
    'admin@notaperusahaan.com', 
    '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
) ON CONFLICT (username) DO NOTHING;

-- Create a test user (password: user123)
INSERT INTO public.users (full_name, username, email, password) 
VALUES (
    'Test User', 
    'user', 
    'user@notaperusahaan.com', 
    '04f8996da763b7a969b1028ee3007569eaf3a635486ddab211d512c85b9df8fb5'
) ON CONFLICT (username) DO NOTHING;

-- Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT USAGE ON SEQUENCE public.users_id_seq TO authenticated;

-- Show created table
SELECT * FROM public.users;
