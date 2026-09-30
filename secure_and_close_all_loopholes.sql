-- ==============================================================================
-- COMPREHENSIVE SECURITY PATCH: CLOSE ALL PRIVILEGE ESCALATION & SECURITY LOOPHOLES
-- ==============================================================================
-- Run this entire script in your Supabase SQL Editor.
-- It locks down:
--   1. Self-assigned admin role loophole at signup & via profiles UPDATE
--   2. Direct balance and referral earnings tampering
--   3. Data exposure (bank accounts, emails, investments, transactions)
--   4. Password reset and signup OTP leaks
--   5. Unauthenticated / unauthorized admin and financial RPC functions
--   6. Unprotected wallets, cryptocurrency receiving addresses, and platform settings
-- ==============================================================================

-- ==============================================================================
-- STEP 0: ENSURE ALL DATABASE SCHEMAS, TABLES, AND COLUMNS EXIST
-- ==============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'trader',
  status TEXT DEFAULT 'active',
  avatar_url TEXT,
  withdrawable_balance NUMERIC DEFAULT 0,
  referral_earnings NUMERIC DEFAULT 0,
  referred_by UUID REFERENCES public.profiles(id),
  has_invested BOOLEAN DEFAULT false,
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  vendor_verification_status TEXT DEFAULT 'not_applied',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'trader',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS withdrawable_balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_earnings NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS referred_by UUID,
  ADD COLUMN IF NOT EXISTS has_invested BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS account_name TEXT,
  ADD COLUMN IF NOT EXISTS vendor_verification_status TEXT DEFAULT 'not_applied';

-- 2. Vendor Plans Table
CREATE TABLE IF NOT EXISTS public.vendor_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_type TEXT,
  min_amount NUMERIC NOT NULL DEFAULT 0,
  max_amount NUMERIC NOT NULL DEFAULT 0,
  daily_roi NUMERIC NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  status TEXT DEFAULT 'active',
  eligibility_status TEXT DEFAULT 'approved',
  slots INTEGER DEFAULT 10,
  fixed_limit NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Investments Table
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.vendor_plans(id),
  plan_name TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  return NUMERIC DEFAULT 0,
  expected_profit NUMERIC DEFAULT 0,
  daily_return NUMERIC DEFAULT 0,
  duration INTEGER DEFAULT 24,
  status TEXT DEFAULT 'pending',
  payment_proof TEXT,
  payment_proof_uploaded_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  bonus NUMERIC DEFAULT 0,
  claimed_amount NUMERIC DEFAULT 0,
  last_claim_at TIMESTAMPTZ,
  reinvested BOOLEAN DEFAULT false,
  commission_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.investments 
  ADD COLUMN IF NOT EXISTS plan_id UUID,
  ADD COLUMN IF NOT EXISTS plan_name TEXT,
  ADD COLUMN IF NOT EXISTS return NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expected_profit NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_return NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 24,
  ADD COLUMN IF NOT EXISTS payment_proof TEXT,
  ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bonus NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS claimed_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_claim_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reinvested BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT false;

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'completed',
  description TEXT,
  address TEXT,
  crypto TEXT,
  fee NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS crypto TEXT,
  ADD COLUMN IF NOT EXISTS fee NUMERIC DEFAULT 0;

-- 5. Vendor Payment Wallets Table
CREATE TABLE IF NOT EXISTS public.vendor_payment_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  address TEXT NOT NULL,
  network TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.vendor_payment_wallets (name, symbol, address, network)
SELECT 'Bitcoin', 'BTC', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'Bitcoin'
WHERE NOT EXISTS (SELECT 1 FROM public.vendor_payment_wallets WHERE symbol = 'BTC');

INSERT INTO public.vendor_payment_wallets (name, symbol, address, network)
SELECT 'Ethereum', 'ETH', '0x742d35Cc6634C0532925a3b8D4C9db96590b5c8e', 'Ethereum'
WHERE NOT EXISTS (SELECT 1 FROM public.vendor_payment_wallets WHERE symbol = 'ETH');

INSERT INTO public.vendor_payment_wallets (name, symbol, address, network)
SELECT 'Tether USDT', 'USDT', 'TQn9Y2khEsLJW1ChVWFMSMeRDow5oREqjK', 'Tron TRC20'
WHERE NOT EXISTS (SELECT 1 FROM public.vendor_payment_wallets WHERE symbol = 'USDT');

INSERT INTO public.vendor_payment_wallets (name, symbol, address, network)
SELECT 'USDC', 'USDC', '0x742d35Cc6634C0532925a3b8D4C9db96590b5c8e', 'Ethereum ERC20'
WHERE NOT EXISTS (SELECT 1 FROM public.vendor_payment_wallets WHERE symbol = 'USDC');

-- 6. Cryptocurrencies Table
CREATE TABLE IF NOT EXISTS public.cryptocurrencies (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  network TEXT,
  fee NUMERIC DEFAULT 0,
  min_withdraw NUMERIC DEFAULT 0,
  address TEXT DEFAULT ''
);

ALTER TABLE public.cryptocurrencies 
  ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';

INSERT INTO public.cryptocurrencies (id, symbol, name, color, network, fee, min_withdraw, address) VALUES
('bitcoin', 'BTC', 'Bitcoin', 'text-orange-400', 'Bitcoin', 0.0002, 0.001, ''),
('ethereum', 'ETH', 'Ethereum', 'text-gray-400', 'ERC20', 0.001, 0.01, ''),
('tether', 'USDT', 'Tether', 'text-green-400', 'TRC20', 1, 10, '')
ON CONFLICT (id) DO NOTHING;

-- 7. Platform Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  min_withdrawal_amount NUMERIC DEFAULT 50,
  max_withdrawal_amount NUMERIC DEFAULT 10000,
  withdrawal_fee_percent NUMERIC DEFAULT 2,
  level1_commission_percent NUMERIC DEFAULT 10,
  level2_commission_percent NUMERIC DEFAULT 5,
  level3_commission_percent NUMERIC DEFAULT 2
);

INSERT INTO public.settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 8. Signup & Password Reset OTP Tables
CREATE TABLE IF NOT EXISTS public.signup_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  verified BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_signup_otps_email ON public.signup_otps(LOWER(email));

CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  verified BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON public.password_reset_otps(LOWER(email));

-- 9. Notifications & Notification Reads Tables
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

-- ------------------------------------------------------------------------------
-- STEP 1: HELPER FUNCTION TO VERIFY ADMINISTRATOR IDENTITY
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- STEP 2: FIX SIGNUP TRIGGER (NEVER ALLOW ADMIN ROLE FROM REGISTRATION)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Whitelist: only 'trader' or 'vendor' are acceptable roles at registration.
    -- Any attempt to send 'admin' or arbitrary roles will default to 'trader'.
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

    -- Handle referral attribution
    IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
        UPDATE public.profiles
        SET referred_by = (
            SELECT id FROM public.profiles
            WHERE username = NEW.raw_user_meta_data->>'referral_code'
            LIMIT 1
        )
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- STEP 3: STRICT BEFORE UPDATE TRIGGER ON PROFILES (BLOCKS PRIVILEGE ESCALATION)
-- ------------------------------------------------------------------------------
-- This trigger prevents ANY user from updating role, withdrawable_balance,
-- referral_earnings, or self-approving their vendor status.
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow service_role or true admins full update permissions
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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_fields();

-- ------------------------------------------------------------------------------
-- STEP 4: HARDEN PROFILES ROW LEVEL SECURITY
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or admin view all" ON public.profiles;

-- Users can only view their own profile; Admins can view all profiles
CREATE POLICY "Users can view own profile or admin view all" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id 
        OR public.is_admin(auth.uid())
    );

-- Users can update their own profile (guarded by protect_profile_fields trigger); Admins can update any
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id 
        OR public.is_admin(auth.uid())
    );

-- ------------------------------------------------------------------------------
-- STEP 5: HARDEN INVESTMENTS ROW LEVEL SECURITY
-- ------------------------------------------------------------------------------
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can insert own investments" ON public.investments;
DROP POLICY IF EXISTS "Admins can update investments" ON public.investments;
DROP POLICY IF EXISTS "Admins can delete investments" ON public.investments;
DROP POLICY IF EXISTS "Admins can manage investments" ON public.investments;
DROP POLICY IF EXISTS "Investments select policy" ON public.investments;
DROP POLICY IF EXISTS "Users can insert pending investment" ON public.investments;

-- Users view only their own investments, vendors view investments on their plans, admins view all
CREATE POLICY "Investments select policy" ON public.investments
    FOR SELECT USING (
        auth.uid() = user_id
        OR public.is_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.vendor_plans vp 
            WHERE vp.id = investments.plan_id AND vp.vendor_id = auth.uid()
        )
    );

-- Users can insert investments for themselves ONLY with status = 'pending'
CREATE POLICY "Users can insert pending investment" ON public.investments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND status = 'pending'
    );

-- Only Admins can update investments (for approvals/denials)
CREATE POLICY "Admins can update investments" ON public.investments
    FOR UPDATE USING (
        public.is_admin(auth.uid())
    );

-- Only Admins can delete investments
CREATE POLICY "Admins can delete investments" ON public.investments
    FOR DELETE USING (
        public.is_admin(auth.uid())
    );

-- ------------------------------------------------------------------------------
-- STEP 6: HARDEN TRANSACTIONS ROW LEVEL SECURITY
-- ------------------------------------------------------------------------------
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can delete transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "Transactions select policy" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert pending transactions" ON public.transactions;

-- Users view only their own transactions, admins view all
CREATE POLICY "Transactions select policy" ON public.transactions
    FOR SELECT USING (
        auth.uid() = user_id
        OR public.is_admin(auth.uid())
    );

-- Users can only insert their own transactions with status = 'pending'
CREATE POLICY "Users can insert pending transactions" ON public.transactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND status = 'pending'
    );

-- Only Admins can update transactions
CREATE POLICY "Admins can update transactions" ON public.transactions
    FOR UPDATE USING (
        public.is_admin(auth.uid())
    );

-- Only Admins can delete transactions
CREATE POLICY "Admins can delete transactions" ON public.transactions
    FOR DELETE USING (
        public.is_admin(auth.uid())
    );

-- ------------------------------------------------------------------------------
-- STEP 7: HARDEN VENDOR PLANS ROW LEVEL SECURITY
-- ------------------------------------------------------------------------------
ALTER TABLE public.vendor_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendor plans are viewable by everyone" ON public.vendor_plans;
DROP POLICY IF EXISTS "Anyone can view approved plans" ON public.vendor_plans;
DROP POLICY IF EXISTS "Users can view approved plans" ON public.vendor_plans;
DROP POLICY IF EXISTS "Vendors can insert own plans" ON public.vendor_plans;
DROP POLICY IF EXISTS "Vendors can update own plans" ON public.vendor_plans;
DROP POLICY IF EXISTS "Admins can manage vendor plans" ON public.vendor_plans;
DROP POLICY IF EXISTS "Vendor plans select policy" ON public.vendor_plans;
DROP POLICY IF EXISTS "Vendors can insert pending plans" ON public.vendor_plans;
DROP POLICY IF EXISTS "Vendors can update own pending plans" ON public.vendor_plans;
DROP POLICY IF EXISTS "Vendor plans delete policy" ON public.vendor_plans;

-- Approved active plans are public; vendors can view their own; admins can view all
CREATE POLICY "Vendor plans select policy" ON public.vendor_plans
    FOR SELECT USING (
        (status = 'active' AND eligibility_status = 'approved')
        OR auth.uid() = vendor_id
        OR public.is_admin(auth.uid())
    );

-- Vendors can insert plans only with eligibility_status = 'pending'
CREATE POLICY "Vendors can insert pending plans" ON public.vendor_plans
    FOR INSERT WITH CHECK (
        auth.uid() = vendor_id
        AND eligibility_status = 'pending'
    );

-- Admins can update all plans; Vendors can update their own plans BUT cannot self-approve
CREATE POLICY "Vendors can update own pending plans" ON public.vendor_plans
    FOR UPDATE USING (
        auth.uid() = vendor_id
        OR public.is_admin(auth.uid())
    )
    WITH CHECK (
        public.is_admin(auth.uid())
        OR (auth.uid() = vendor_id AND eligibility_status != 'approved')
    );

-- Vendors can delete their own plans; Admins can delete any plan
CREATE POLICY "Vendor plans delete policy" ON public.vendor_plans
    FOR DELETE USING (
        auth.uid() = vendor_id
        OR public.is_admin(auth.uid())
    );

-- ------------------------------------------------------------------------------
-- STEP 8: HARDEN WALLETS, CRYPTOCURRENCIES, AND PLATFORM SETTINGS
-- ------------------------------------------------------------------------------
-- Vendor payment wallets
ALTER TABLE public.vendor_payment_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vendors can view company payment wallets" ON public.vendor_payment_wallets;
DROP POLICY IF EXISTS "Admins can manage company payment wallets" ON public.vendor_payment_wallets;
DROP POLICY IF EXISTS "View vendor payment wallets" ON public.vendor_payment_wallets;
DROP POLICY IF EXISTS "Admins manage vendor payment wallets" ON public.vendor_payment_wallets;

CREATE POLICY "View vendor payment wallets" ON public.vendor_payment_wallets
    FOR SELECT USING (
        is_active = true 
        OR public.is_admin(auth.uid())
    );

CREATE POLICY "Admins manage vendor payment wallets" ON public.vendor_payment_wallets
    FOR ALL USING (
        public.is_admin(auth.uid())
    );

-- Cryptocurrencies
ALTER TABLE public.cryptocurrencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view cryptocurrencies" ON public.cryptocurrencies;
DROP POLICY IF EXISTS "Admins can manage cryptocurrencies" ON public.cryptocurrencies;

CREATE POLICY "Anyone can view cryptocurrencies" ON public.cryptocurrencies
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage cryptocurrencies" ON public.cryptocurrencies
    FOR ALL USING (
        public.is_admin(auth.uid())
    );

-- Settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users view settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;

CREATE POLICY "Authenticated users view settings" ON public.settings
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        OR public.is_admin(auth.uid())
    );

CREATE POLICY "Admins can manage settings" ON public.settings
    FOR ALL USING (
        public.is_admin(auth.uid())
    );

-- ------------------------------------------------------------------------------
-- STEP 9: SECURE SIGNUP & PASSWORD RESET OTP TABLES (REVOKE DIRECT ACCESS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.signup_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon & auth access to signup_otps" ON public.signup_otps;
DROP POLICY IF EXISTS "Allow anon & auth access to password_reset_otps" ON public.password_reset_otps;

-- Disallow any direct SELECT/INSERT/UPDATE/DELETE from client postgrest
REVOKE ALL ON public.signup_otps FROM anon, authenticated;
REVOKE ALL ON public.password_reset_otps FROM anon, authenticated;

-- Ensure SECURITY DEFINER functions retain execute privileges
GRANT EXECUTE ON FUNCTION public.store_signup_otp(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_signup_otp(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.store_password_reset_otp(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_password_reset_otp(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_password_with_otp(TEXT, UUID, TEXT) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- STEP 10: SECURE ALL FINANCIAL & ADMINISTRATIVE RPC FUNCTIONS
-- ------------------------------------------------------------------------------

-- 1. approve_withdrawal: MUST BE ADMIN ONLY
CREATE OR REPLACE FUNCTION public.approve_withdrawal(withdrawal_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: Administrator access required.';
    END IF;

    UPDATE public.transactions
    SET status = 'approved'
    WHERE id = withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. reject_withdrawal: MUST BE ADMIN ONLY
CREATE OR REPLACE FUNCTION public.reject_withdrawal(withdrawal_id UUID)
RETURNS VOID AS $$
DECLARE
    v_amount NUMERIC;
    v_user_id UUID;
    v_status TEXT;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: Administrator access required.';
    END IF;

    SELECT amount, user_id, status INTO v_amount, v_user_id, v_status
    FROM public.transactions
    WHERE id = withdrawal_id
    FOR UPDATE;

    IF v_status = 'pending' THEN
        UPDATE public.profiles
        SET withdrawable_balance = withdrawable_balance + v_amount
        WHERE id = v_user_id;

        UPDATE public.transactions
        SET status = 'denied'
        WHERE id = withdrawal_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. add_bonus & add_bonus_to_investment & deduct_bonus: MUST BE ADMIN ONLY
CREATE OR REPLACE FUNCTION public.add_bonus(investment_id_input UUID, bonus_amount_input NUMERIC)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: Administrator access required.';
    END IF;

    UPDATE public.investments
    SET bonus = COALESCE(bonus, 0) + bonus_amount_input
    WHERE id = investment_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.add_bonus_to_investment(investment_id_input UUID, bonus_amount_input NUMERIC)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: Administrator access required.';
    END IF;

    UPDATE public.investments
    SET bonus = COALESCE(bonus, 0) + bonus_amount_input
    WHERE id = investment_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.deduct_bonus(p_investment_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
DECLARE
    v_current_bonus DECIMAL;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: Administrator access required.';
    END IF;

    SELECT bonus INTO v_current_bonus FROM public.investments WHERE id = p_investment_id;

    IF v_current_bonus >= p_amount THEN
        UPDATE public.investments
        SET bonus = bonus - p_amount
        WHERE id = p_investment_id;
    ELSE
        RAISE EXCEPTION 'Insufficient bonus';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. execute_withdrawal: USER CAN ONLY WITHDRAW FOR THEMSELVES
CREATE OR REPLACE FUNCTION public.execute_withdrawal(
    p_user_id UUID,
    p_amount NUMERIC,
    p_fee NUMERIC,
    p_description TEXT,
    p_address TEXT,
    p_pending_investment_ids UUID[]
)
RETURNS JSONB AS $$
DECLARE
    v_current_balance NUMERIC;
BEGIN
    IF auth.uid() IS NULL OR (auth.uid() != p_user_id AND NOT public.is_admin(auth.uid())) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: You can only execute withdrawals for your own account.');
    END IF;

    IF p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid withdrawal amount.');
    END IF;

    SELECT withdrawable_balance INTO v_current_balance
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_current_balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient assets for this withdrawal.');
    END IF;

    IF array_length(p_pending_investment_ids, 1) > 0 THEN
        UPDATE public.investments
        SET commission_paid = true
        WHERE id = ANY(p_pending_investment_ids)
        AND user_id = p_user_id;
    END IF;

    UPDATE public.profiles
    SET withdrawable_balance = withdrawable_balance - p_amount
    WHERE id = p_user_id;

    INSERT INTO public.transactions (
        user_id,
        type,
        amount,
        fee,
        status,
        description,
        withdrawal_type,
        crypto,
        address
    ) VALUES (
        p_user_id,
        'withdrawal',
        p_amount,
        p_fee,
        'pending',
        p_description,
        'to_bank',
        'NGN',
        p_address
    );

    RETURN jsonb_build_object('success', true, 'message', 'Withdrawal processed successfully.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. claim_referral_earnings: USER CAN ONLY CLAIM THEIR OWN EARNINGS
CREATE OR REPLACE FUNCTION public.claim_referral_earnings(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_earnings NUMERIC;
BEGIN
    IF auth.uid() IS NULL OR (auth.uid() != p_user_id AND NOT public.is_admin(auth.uid())) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized.');
    END IF;

    SELECT referral_earnings INTO v_earnings
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_earnings IS NULL OR v_earnings <= 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'No referral earnings available to claim.');
    END IF;

    UPDATE public.profiles
    SET 
        withdrawable_balance = withdrawable_balance + v_earnings,
        referral_earnings = 0
    WHERE id = p_user_id;

    INSERT INTO public.transactions (
        user_id,
        type,
        amount,
        status,
        description
    ) VALUES (
        p_user_id,
        'withdrawal',
        v_earnings,
        'completed',
        'Referral earnings to withdrawable balance'
    );

    RETURN jsonb_build_object('success', true, 'message', 'Referral earnings claimed successfully.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. withdraw_investment_to_balance: SECURE PAYOUT CALCULATION FROM DB RECORD
CREATE OR REPLACE FUNCTION public.withdraw_investment_to_balance(
    p_user_id UUID,
    p_investment_id UUID,
    p_total_return NUMERIC DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_inv RECORD;
    v_payout NUMERIC;
BEGIN
    IF auth.uid() IS NULL OR (auth.uid() != p_user_id AND NOT public.is_admin(auth.uid())) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized.');
    END IF;

    SELECT * INTO v_inv
    FROM public.investments
    WHERE id = p_investment_id AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Investment not found.');
    END IF;

    IF v_inv.status NOT IN ('active', 'completed') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Investment cannot be withdrawn in its current status.');
    END IF;

    -- Calculate legitimate payout strictly from database row values:
    v_payout := COALESCE(v_inv.amount, 0) + COALESCE(v_inv.return, 0) + COALESCE(v_inv.bonus, 0);

    UPDATE public.profiles
    SET withdrawable_balance = COALESCE(withdrawable_balance, 0) + v_payout
    WHERE id = p_user_id;

    UPDATE public.investments
    SET status = 'withdrawn', bonus = 0
    WHERE id = p_investment_id AND user_id = p_user_id;

    RETURN jsonb_build_object('success', true, 'message', 'Funds added to balance successfully.', 'amount', v_payout);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. reinvest_capital_from_balance: USER CAN ONLY REINVEST OWN FUNDS
CREATE OR REPLACE FUNCTION public.reinvest_capital_from_balance(
    p_user_id UUID,
    p_old_investment_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_old_investment RECORD;
    v_balance NUMERIC;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    IF auth.uid() IS NULL OR (auth.uid() != p_user_id AND NOT public.is_admin(auth.uid())) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized.');
    END IF;

    SELECT * INTO v_old_investment 
    FROM public.investments 
    WHERE id = p_old_investment_id AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Investment not found');
    END IF;

    IF v_old_investment.status != 'completed' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Investment must be completed before reinvesting');
    END IF;

    IF COALESCE(v_old_investment.reinvested, false) = true THEN
        RETURN jsonb_build_object('success', false, 'message', 'This investment has already been reinvested');
    END IF;

    SELECT withdrawable_balance INTO v_balance 
    FROM public.profiles 
    WHERE id = p_user_id 
    FOR UPDATE;

    IF v_balance < v_old_investment.amount THEN
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient balance to reinvest capital of ₦' || v_old_investment.amount);
    END IF;

    UPDATE public.profiles
    SET withdrawable_balance = withdrawable_balance - v_old_investment.amount
    WHERE id = p_user_id;

    UPDATE public.investments
    SET reinvested = true
    WHERE id = p_old_investment_id;

    INSERT INTO public.investments (
        user_id,
        plan_id,
        plan_name,
        amount,
        crypto,
        status,
        expected_profit,
        daily_return,
        duration,
        reinvested,
        approved_at,
        due_date
    ) VALUES (
        p_user_id,
        v_old_investment.plan_id,
        v_old_investment.plan_name,
        v_old_investment.amount,
        v_old_investment.crypto,
        'active',
        v_old_investment.expected_profit,
        v_old_investment.daily_return,
        COALESCE(v_old_investment.duration, 24),
        true,
        v_now,
        v_now + (COALESCE(v_old_investment.duration, 24) || ' days')::interval
    );

    RETURN jsonb_build_object('success', true, 'message', 'Capital successfully reinvested! Your new trade is active.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- STEP 11: SAFE AGGREGATED LIVE ACTIVITY FEED (NO DATA EXPOSURE)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_live_activity_feed()
RETURNS json AS $$
DECLARE
    v_signups json;
    v_investments json;
    v_transactions json;
    v_plans json;
BEGIN
    SELECT COALESCE(json_agg(s), '[]'::json) INTO v_signups
    FROM (
        SELECT id, username, created_at
        FROM public.profiles
        WHERE username IS NOT NULL
        ORDER BY created_at DESC LIMIT 10
    ) s;

    SELECT COALESCE(json_agg(i), '[]'::json) INTO v_investments
    FROM (
        SELECT inv.id, inv.amount, inv.plan_name, p.username, inv.created_at
        FROM public.investments inv
        LEFT JOIN public.profiles p ON p.id = inv.user_id
        WHERE inv.status = 'active'
        ORDER BY inv.created_at DESC LIMIT 10
    ) i;

    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_transactions
    FROM (
        SELECT tr.id, tr.type, tr.amount, p.username, tr.created_at
        FROM public.transactions tr
        LEFT JOIN public.profiles p ON p.id = tr.user_id
        WHERE tr.type IN ('withdrawal', 'profit', 'referral')
        ORDER BY tr.created_at DESC LIMIT 10
    ) t;

    SELECT COALESCE(json_agg(pl), '[]'::json) INTO v_plans
    FROM (
        SELECT id, name, asset_type, created_at
        FROM public.vendor_plans
        WHERE status = 'active' AND eligibility_status = 'approved'
        ORDER BY created_at DESC LIMIT 5
    ) pl;

    RETURN json_build_object(
        'signups', v_signups,
        'investments', v_investments,
        'transactions', v_transactions,
        'plans', v_plans
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_live_activity_feed() TO anon, authenticated;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- AUDIT INSTRUCTIONS FOR CURRENT ADMINS:
-- ==============================================================================
-- Run the following SELECT query to see who currently has the 'admin' role:
--
-- SELECT id, email, first_name, last_name, role, created_at 
-- FROM public.profiles 
-- WHERE role = 'admin';
--
-- If unauthorized users (like your friend) made themselves admin, demote them
-- by running:
--
-- UPDATE public.profiles 
-- SET role = 'trader' 
-- WHERE role = 'admin' 
--   AND email != 'YOUR_REAL_ADMIN_EMAIL_HERE';
-- ==============================================================================
