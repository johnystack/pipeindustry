-- 1. Ensure RLS is enabled for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- 3. Create policies
-- Allow everyone to view public profile info (or just admins, depending on your needs)
-- Here we allow users to see their own, and admins to see everyone
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Allow users to update their own profiles
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow admins to update all profiles (for balance management etc)
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Verification
SELECT * FROM pg_policies WHERE tablename = 'profiles';
