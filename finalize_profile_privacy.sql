-- ==============================================================================
-- FINAL STEP: CLOSE PROFILE QUERY DATA LEAK (ANON & CROSS-USER QUERY LOCKDOWN)
-- ==============================================================================
-- Run this in your Supabase SQL Editor.
-- This cleans up all residual legacy read policies so that unauthenticated users
-- and normal traders CANNOT query other users' bank details, emails, or balances.
-- ==============================================================================

-- 1. DYNAMICALLY DROP ALL EXISTING POLICIES ON public.profiles (REGARDLESS OF NAME)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 2. ENSURE ROW LEVEL SECURITY IS STRICTLY ENABLED
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. COMPLETELY REVOKE DIRECT TABLE ACCESS FROM UNCHECKED ANONYMOUS USERS
-- Anon users must NEVER directly query user profile rows.
REVOKE ALL ON public.profiles FROM anon;

-- 4. CONFIGURE STRICT AUTHENTICATED USER PERMISSIONS
REVOKE ALL ON public.profiles FROM authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- Grant column-level UPDATE strictly on safe profile attributes
GRANT UPDATE (
    first_name, 
    last_name, 
    username, 
    avatar_url, 
    bank_name, 
    account_number, 
    account_name, 
    phone, 
    country, 
    timezone, 
    wallet_address, 
    vendor_verification_status, 
    vendor_verification_tx
) ON public.profiles TO authenticated;

-- 5. RE-APPLY STRICT POLICIES FOR AUTHENTICATED USERS
-- A. SELECT: Users can ONLY view their own profile; only genuine Admins can view all profiles
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        auth.uid() = id 
        OR public.is_admin(auth.uid())
    );

-- B. UPDATE: Users can ONLY update their own profile; guarded by protect_profile_fields trigger
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = id 
        OR public.is_admin(auth.uid())
    )
    WITH CHECK (
        auth.uid() = id 
        OR public.is_admin(auth.uid())
    );

-- 6. ENSURE HELPER FUNCTION TO VERIFY ACTIVE POLICIES
CREATE OR REPLACE FUNCTION public.get_profiles_policies()
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT COALESCE(json_agg(row_to_json(p)), '[]'::json)
        FROM (
            SELECT policyname, roles, cmd
            FROM pg_policies
            WHERE tablename = 'profiles' AND schemaname = 'public'
        ) p
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_profiles_policies() TO anon, authenticated, service_role;

-- 7. NOTIFY POSTGREST TO RELOAD SCHEMA CACHE IMMEDIATELY
NOTIFY pgrst, 'reload schema';

-- Verification output: list all active policies on profiles
SELECT policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';
