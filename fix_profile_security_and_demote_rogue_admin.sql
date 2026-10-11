-- ==============================================================================
-- FIX PROFILE SECURITY, LOCK DOWN PROFILE QUERIES & UPDATES, AND DEMOTE ROGUE ADMIN
-- ==============================================================================
-- Run this entire script in your Supabase SQL Editor.
-- This script fixes:
--   1. Demotes rogue admin ('ezejaemmanuel244@gmail.com') back to 'trader'.
--   2. Blocks registration loophole: handle_new_user() will NEVER accept 'admin' role.
--   3. Blocks profile update loophole: BEFORE UPDATE trigger prevents any user from
--      modifying 'role', 'withdrawable_balance', 'referral_earnings', 'has_invested',
--      or self-approving vendor status.
--   4. Blocks query loophole (data exposure): Drops all public/anon read policies so
--      no user or attacker can read other users' profiles, bank details, emails, or balances.
--   5. Implements defense-in-depth column-level UPDATE security.
--   6. Provides secure RPCs for username availability and vendor dashboard investments.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: DEMOTE ROGUE ADMIN(S) AND SECURE THE TRUE ADMIN ACCOUNT
-- ------------------------------------------------------------------------------
-- Specifically demote the friend's account that was elevated to admin
UPDATE public.profiles
SET role = 'trader'
WHERE email = 'ezejaemmanuel244@gmail.com';

-- Ensure only the genuine platform administrator retains admin rights
UPDATE public.profiles
SET role = 'trader'
WHERE role = 'admin'
  AND email != 'moneybest24@gmail.com';

-- Verify genuine admin has role = 'admin'
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'moneybest24@gmail.com';

-- ------------------------------------------------------------------------------
-- STEP 2: HARDEN is_admin() FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN (v_role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- STEP 3: LOCK DOWN REGISTRATION TRIGGER (NEVER ACCEPT 'admin' FROM CLIENT METADATA)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Strict Whitelist: Only 'trader' or 'vendor' are permitted during registration.
    -- Any attempt to send 'admin' or arbitrary roles will strictly resolve to 'trader'.
    IF NEW.raw_user_meta_data->>'role' = 'vendor' THEN
        v_role := 'vendor';
    ELSE
        v_role := 'trader';
    END IF;

    INSERT INTO public.profiles (
        id, 
        first_name, 
        last_name, 
        email, 
        role, 
        status, 
        username
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        v_role,
        'pending',
        NEW.raw_user_meta_data->>'username'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.profiles.first_name),
        last_name  = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.profiles.last_name),
        username   = COALESCE(NULLIF(EXCLUDED.username, ''), public.profiles.username);

    -- Handle referral attribution safely
    IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
        UPDATE public.profiles
        SET referred_by = (
            SELECT id FROM public.profiles 
            WHERE username = NEW.raw_user_meta_data->>'referral_code' 
            LIMIT 1
        )
        WHERE id = NEW.id;
    END IF;

    -- Send initial signup OTP verification if helper function exists
    BEGIN
        PERFORM public.send_signup_otp(NEW.email);
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Ensure trigger is cleanly attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- STEP 4: STRICT BEFORE UPDATE TRIGGER ON PROFILES (BLOCKS PRIVILEGE ESCALATION)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow service_role or verified admins to perform administrative updates
    IF public.is_admin(auth.uid()) OR current_user IN ('postgres', 'service_role') THEN
        RETURN NEW;
    END IF;

    -- 1. Prevent changing user role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Security Violation: Modifying user role is strictly prohibited.';
    END IF;

    -- 2. Prevent changing withdrawable_balance directly
    IF NEW.withdrawable_balance IS DISTINCT FROM OLD.withdrawable_balance THEN
        RAISE EXCEPTION 'Security Violation: Direct modification of account balance is prohibited.';
    END IF;

    -- 3. Prevent changing referral_earnings directly
    IF NEW.referral_earnings IS DISTINCT FROM OLD.referral_earnings THEN
        RAISE EXCEPTION 'Security Violation: Direct modification of referral earnings is prohibited.';
    END IF;

    -- 4. Prevent changing has_invested directly
    IF NEW.has_invested IS DISTINCT FROM OLD.has_invested THEN
        RAISE EXCEPTION 'Security Violation: Direct modification of investment status is prohibited.';
    END IF;

    -- 5. Prevent self-approving vendor status
    IF NEW.vendor_verification_status = 'approved' AND OLD.vendor_verification_status IS DISTINCT FROM 'approved' THEN
        RAISE EXCEPTION 'Security Violation: Vendor status can only be approved by an administrator.';
    END IF;

    -- 6. Prevent self-activating account without OTP
    IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
        IF auth.uid() IS NOT NULL AND auth.uid() = OLD.id AND NOT public.is_admin(auth.uid()) THEN
            RAISE EXCEPTION 'Security Violation: Account activation must occur through OTP verification.';
        END IF;
    END IF;

    -- 7. Prevent modifying immutable identity ID
    IF NEW.id IS DISTINCT FROM OLD.id THEN
        RAISE EXCEPTION 'Security Violation: Modifying user ID is prohibited.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_fields();

-- ------------------------------------------------------------------------------
-- STEP 5: LOCK DOWN ROW LEVEL SECURITY (RLS) ON PROFILES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all old and permissive policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access" ON public.profiles;
DROP POLICY IF EXISTS "Allow all to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or admin view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own verification status" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admin update all" ON public.profiles;

-- 1. SELECT Policy: Users see only their own profile; true Admin sees all profiles
CREATE POLICY "Users can view own profile or admin view all" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id 
        OR public.is_admin(auth.uid())
    );

-- 2. UPDATE Policy: Users can only update their own profile; true Admin can update any
CREATE POLICY "Users can update own profile or admin update all" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id 
        OR public.is_admin(auth.uid())
    )
    WITH CHECK (
        auth.uid() = id 
        OR public.is_admin(auth.uid())
    );

-- ------------------------------------------------------------------------------
-- STEP 6: DEFENSE IN DEPTH: RESTRICT COLUMN-LEVEL UPDATE PERMISSIONS
-- ------------------------------------------------------------------------------
-- Revoke blind UPDATE permissions so authenticated users cannot even target
-- sensitive columns (role, balance, etc.) in raw SQL statements.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;

-- Grant column-level UPDATE ONLY for safe profile fields
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

-- ------------------------------------------------------------------------------
-- STEP 7: SECURE RPC FUNCTIONS FOR FRONTEND FEATURES
-- ------------------------------------------------------------------------------

-- 1. RPC to safely check username availability without exposing user rows
CREATE OR REPLACE FUNCTION public.check_username_available(p_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_username IS NULL OR trim(p_username) = '' THEN
        RETURN FALSE;
    END IF;

    RETURN NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE LOWER(username) = LOWER(trim(p_username))
          AND (auth.uid() IS NULL OR id != auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.check_username_available(TEXT) TO anon, authenticated, service_role;

-- 2. RPC for Vendor Dashboard to load investments with investor username safely
CREATE OR REPLACE FUNCTION public.get_vendor_dashboard_investments(p_vendor_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    IF auth.uid() IS NULL OR (auth.uid() != p_vendor_id AND NOT public.is_admin(auth.uid())) THEN
        RAISE EXCEPTION 'Unauthorized: only the vendor or admin can access vendor investments.';
    END IF;

    SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json) INTO v_result
    FROM (
        SELECT 
            i.id,
            i.plan_id,
            i.plan_name,
            i.amount,
            i.return,
            i.expected_profit,
            i.daily_return,
            i.duration,
            i.status,
            i.created_at,
            i.due_date,
            i.user_id,
            json_build_object(
                'id', vp.id,
                'name', vp.name,
                'vendor_id', vp.vendor_id
            ) AS vendor_plans,
            json_build_object(
                'username', p.username
            ) AS profiles
        FROM public.investments i
        JOIN public.vendor_plans vp ON vp.id = i.plan_id
        LEFT JOIN public.profiles p ON p.id = i.user_id
        WHERE vp.vendor_id = p_vendor_id
          AND i.status IN ('active', 'completed')
        ORDER BY i.created_at DESC
    ) r;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.get_vendor_dashboard_investments(UUID) TO authenticated, service_role;

-- 3. Unique index on username (prevents duplicate usernames & collisions)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower 
ON public.profiles(LOWER(username)) 
WHERE username IS NOT NULL;

-- ------------------------------------------------------------------------------
-- STEP 8: REFRESH POSTGREST SCHEMA CACHE
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- Verification query
SELECT id, email, first_name, last_name, role, username, created_at 
FROM public.profiles 
WHERE role = 'admin';
