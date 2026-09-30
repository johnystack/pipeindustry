-- ==========================================
-- COMPREHENSIVE SUPABASE SCHEMA REPAIR SCRIPT
-- ==========================================
-- Run this script in your Supabase Dashboard SQL Editor to fix missing tables,
-- columns, foreign key constraints, RPC functions, and RLS policies.

-- 1. FIX PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user',
  avatar_url TEXT,
  withdrawable_balance NUMERIC DEFAULT 0,
  referral_earnings NUMERIC DEFAULT 0,
  referred_by UUID REFERENCES public.profiles(id),
  has_invested BOOLEAN DEFAULT false,
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns to profiles if table already existed
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS withdrawable_balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_earnings NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS referred_by UUID,
  ADD COLUMN IF NOT EXISTS has_invested BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS account_name TEXT;

-- 2. FIX VENDOR_PLANS TABLE
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

-- 3. FIX INVESTMENTS TABLE
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
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns to investments if table already existed
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
  ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT false;

-- Ensure investments user_id FK constraint to profiles exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'investments_user_id_fkey' 
        AND table_name = 'investments'
    ) THEN
        ALTER TABLE public.investments 
        ADD CONSTRAINT investments_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. FIX TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'completed',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure transactions user_id FK constraint to profiles exists for PostgREST joins
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transactions_user_id_fkey' 
        AND table_name = 'transactions'
    ) THEN
        ALTER TABLE public.transactions 
        ADD CONSTRAINT transactions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. FIX NOTIFICATIONS & NOTIFICATION_READS TABLES
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

-- 5b. FIX CRYPTOCURRENCIES TABLE
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

-- 5c. FIX VENDOR PAYMENT WALLETS TABLE
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

-- 5d. FIX SETTINGS TABLE
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

-- 5e. FIX OTP TABLES
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

-- 6. FIX RPC FUNCTIONS
CREATE OR REPLACE FUNCTION public.update_due_investments()
RETURNS void AS $$
BEGIN
  -- Multi-stage 6-claim investment logic:
  -- Investments must only be marked completed once all 6 claim stages (150% total ROI) are claimed.
  -- Never prematurely conclude investments based on days elapsed while claims remain.
  UPDATE public.investments
  SET status = 'completed'
  WHERE status = 'active'
  AND COALESCE(claimed_amount, 0) >= (amount * 1.5);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_dashboard_data(p_user_id uuid)
RETURNS json AS $$
BEGIN
  PERFORM public.update_due_investments();

  RETURN json_build_object(
    'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE id = p_user_id),
    'investments', (SELECT json_agg(row_to_json(i)) FROM public.investments i WHERE user_id = p_user_id),
    'recent_transactions', (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM public.transactions WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 5) t)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- REFERRAL SYSTEM: Only count referral bonus & referral counts for approved active/completed investments
CREATE OR REPLACE FUNCTION public.handle_referral_bonus()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_id UUID;
    v_active_referrals_count INTEGER;
    v_bonus_percent NUMERIC := 0;
    v_bonus_amount NUMERIC := 0;
    v_investor_name TEXT;
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'active') OR
       (TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status = 'active') THEN

        IF NEW.commission_paid = true THEN
            RETURN NEW;
        END IF;

        UPDATE public.profiles 
        SET has_invested = true 
        WHERE id = NEW.user_id;

        SELECT referred_by INTO v_referrer_id 
        FROM public.profiles 
        WHERE id = NEW.user_id;

        IF v_referrer_id IS NOT NULL THEN
            -- Strictly count only referred users who have approved active or completed investments
            SELECT COUNT(DISTINCT user_id) INTO v_active_referrals_count 
            FROM public.investments 
            WHERE status IN ('active', 'completed') 
              AND user_id IN (
                  SELECT id FROM public.profiles WHERE referred_by = v_referrer_id
              );

            IF v_active_referrals_count = 2 THEN
                v_bonus_percent := 5;
            ELSIF v_active_referrals_count >= 3 AND v_active_referrals_count <= 5 THEN
                v_bonus_percent := 10;
            ELSIF v_active_referrals_count >= 6 AND v_active_referrals_count <= 8 THEN
                v_bonus_percent := 15;
            ELSIF v_active_referrals_count >= 9 THEN
                v_bonus_percent := 20;
            ELSE
                v_bonus_percent := 0;
            END IF;

            IF v_bonus_percent > 0 AND NEW.amount > 0 THEN
                v_bonus_amount := (NEW.amount * v_bonus_percent) / 100;

                SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), username, 'Referral') 
                INTO v_investor_name 
                FROM public.profiles WHERE id = NEW.user_id;

                INSERT INTO public.transactions (
                    user_id, 
                    type, 
                    amount, 
                    status, 
                    description, 
                    reference,
                    referred_user_id
                ) VALUES (
                    v_referrer_id,
                    'referral',
                    v_bonus_amount,
                    'completed',
                    v_bonus_percent || '% Commission from ' || v_investor_name || '''s trade',
                    'REF-' || NEW.id || '-' || extract(epoch from now())::text,
                    NEW.user_id
                );

                UPDATE public.profiles 
                SET referral_earnings = COALESCE(referral_earnings, 0) + v_bonus_amount
                WHERE id = v_referrer_id;

                UPDATE public.investments 
                SET commission_paid = true 
                WHERE id = NEW.id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_investment_activated_referral ON public.investments;
CREATE TRIGGER on_investment_activated_referral
    AFTER INSERT OR UPDATE ON public.investments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_referral_bonus();

CREATE OR REPLACE FUNCTION public.get_referral_data(p_user_id uuid)
RETURNS json AS $$
DECLARE
    v_active_count INTEGER;
    v_total_signups INTEGER;
    v_current_tier TEXT;
    v_next_tier_req INTEGER;
    v_current_percent INTEGER;
BEGIN
    SELECT COUNT(DISTINCT user_id) INTO v_active_count 
    FROM public.investments 
    WHERE status IN ('active', 'completed')
      AND user_id IN (SELECT id FROM public.profiles WHERE referred_by = p_user_id);

    SELECT COUNT(*) INTO v_total_signups 
    FROM public.profiles 
    WHERE referred_by = p_user_id;

    IF v_active_count < 2 THEN
        v_current_tier := 'Level 0';
        v_next_tier_req := 2;
        v_current_percent := 0;
    ELSIF v_active_count = 2 THEN
        v_current_tier := 'Level 1';
        v_next_tier_req := 3;
        v_current_percent := 5;
    ELSIF v_active_count >= 3 AND v_active_count <= 5 THEN
        v_current_tier := 'Level 2';
        v_next_tier_req := 6;
        v_current_percent := 10;
    ELSIF v_active_count >= 6 AND v_active_count <= 8 THEN
        v_current_tier := 'Level 3';
        v_next_tier_req := 9;
        v_current_percent := 15;
    ELSE
        v_current_tier := 'Level 4 (Elite)';
        v_next_tier_req := 0;
        v_current_percent := 20;
    END IF;

    RETURN json_build_object(
        'profile', (SELECT row_to_json(p) FROM profiles p WHERE id = p_user_id),
        'referral_stats', json_build_object(
            'total_referrals', v_active_count,
            'active_referrals', v_active_count,
            'total_signups', v_total_signups,
            'pending_referrals', GREATEST(0, v_total_signups - v_active_count),
            'total_earned', COALESCE((SELECT sum(amount) FROM public.transactions WHERE user_id = p_user_id AND type = 'referral' AND status = 'completed'), 0),
            'currentLevel', v_current_tier,
            'currentPercent', v_current_percent,
            'nextTierReq', v_next_tier_req
        ),
        'recent_referrals', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', u.id,
                'name', COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.username, 'User'),
                'joinDate', u.created_at,
                'status', CASE 
                    WHEN EXISTS (SELECT 1 FROM public.investments WHERE user_id = u.id AND status IN ('active', 'completed')) THEN 'Active'
                    WHEN EXISTS (SELECT 1 FROM public.investments WHERE user_id = u.id AND status = 'pending') THEN 'Pending Approval'
                    ELSE 'Not Invested'
                END,
                'has_invested', EXISTS (SELECT 1 FROM public.investments WHERE user_id = u.id AND status IN ('active', 'completed')),
                'invested', COALESCE((SELECT sum(amount) FROM public.investments WHERE user_id = u.id AND status IN ('active', 'completed')), 0),
                'commission', COALESCE((SELECT sum(amount) FROM public.transactions WHERE user_id = p_user_id AND type = 'referral' AND referred_user_id = u.id), 0)
            ) ORDER BY u.created_at DESC), '[]'::json) FROM public.profiles u WHERE referred_by = p_user_id
        ),
        'commission_earnings', (
            SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json) FROM public.transactions t 
            WHERE user_id = p_user_id AND type = 'referral'
        )
    );
END;
$$ LANGUAGE plpgsql;

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

-- Synchronize has_invested for all profiles based on real approved investments
UPDATE public.profiles p
SET has_invested = EXISTS (
    SELECT 1 FROM public.investments i 
    WHERE i.user_id = p.id AND i.status IN ('active', 'completed')
);

-- 7. SECURITY: ADMINISTRATOR VERIFICATION & FIELD PROTECTION
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

-- Prevent non-admins from changing role, balances, or status directly
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF public.is_admin(auth.uid()) OR current_user IN ('postgres', 'service_role') THEN
        RETURN NEW;
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Security Violation: Modifying user role is strictly prohibited.';
    END IF;

    IF NEW.withdrawable_balance IS DISTINCT FROM OLD.withdrawable_balance THEN
        RAISE EXCEPTION 'Security Violation: Direct modification of account balance is prohibited.';
    END IF;

    IF NEW.referral_earnings IS DISTINCT FROM OLD.referral_earnings THEN
        RAISE EXCEPTION 'Security Violation: Direct modification of referral earnings is prohibited.';
    END IF;

    IF NEW.has_invested IS DISTINCT FROM OLD.has_invested THEN
        RAISE EXCEPTION 'Security Violation: Direct modification of investment status is prohibited.';
    END IF;

    IF NEW.vendor_verification_status = 'approved' AND OLD.vendor_verification_status IS DISTINCT FROM 'approved' THEN
        RAISE EXCEPTION 'Security Violation: Vendor status can only be approved by an administrator.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_fields();

-- 8. ENABLE ROW LEVEL SECURITY AND HARDENED POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or admin view all" ON public.profiles;

CREATE POLICY "Users can view own profile or admin view all" ON public.profiles 
    FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles 
    FOR UPDATE USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- Vendor Plans Policies
DROP POLICY IF EXISTS "Vendor plans are viewable by everyone" ON public.vendor_plans;
DROP POLICY IF EXISTS "Vendor plans select policy" ON public.vendor_plans;
CREATE POLICY "Vendor plans select policy" ON public.vendor_plans 
    FOR SELECT USING (
        (status = 'active' AND eligibility_status = 'approved') 
        OR auth.uid() = vendor_id 
        OR public.is_admin(auth.uid())
    );

-- Investments Policies
DROP POLICY IF EXISTS "Users can view own investments" ON public.investments;
DROP POLICY IF EXISTS "Investments select policy" ON public.investments;
DROP POLICY IF EXISTS "Users can insert pending investment" ON public.investments;
DROP POLICY IF EXISTS "Admins can update investments" ON public.investments;

CREATE POLICY "Investments select policy" ON public.investments 
    FOR SELECT USING (
        auth.uid() = user_id 
        OR public.is_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.vendor_plans vp 
            WHERE vp.id = investments.plan_id AND vp.vendor_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert pending investment" ON public.investments
    FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update investments" ON public.investments
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- Transactions Policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Transactions select policy" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert pending transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;

CREATE POLICY "Transactions select policy" ON public.transactions 
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert pending transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update transactions" ON public.transactions
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view notifications" ON public.notifications;
CREATE POLICY "Users can view notifications" ON public.notifications 
    FOR SELECT USING (user_id IS NULL OR user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Notification Reads Policies
DROP POLICY IF EXISTS "Users can manage read status" ON public.notification_reads;
CREATE POLICY "Users can manage read status" ON public.notification_reads 
    FOR ALL USING (user_id = auth.uid());

-- Vendor Payment Wallets Policies
ALTER TABLE public.vendor_payment_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View vendor payment wallets" ON public.vendor_payment_wallets;
DROP POLICY IF EXISTS "Admins manage vendor payment wallets" ON public.vendor_payment_wallets;

CREATE POLICY "View vendor payment wallets" ON public.vendor_payment_wallets
    FOR SELECT USING (is_active = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage vendor payment wallets" ON public.vendor_payment_wallets
    FOR ALL USING (public.is_admin(auth.uid()));

-- Cryptocurrencies Policies
ALTER TABLE public.cryptocurrencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view cryptocurrencies" ON public.cryptocurrencies;
DROP POLICY IF EXISTS "Admins can manage cryptocurrencies" ON public.cryptocurrencies;

CREATE POLICY "Anyone can view cryptocurrencies" ON public.cryptocurrencies
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage cryptocurrencies" ON public.cryptocurrencies
    FOR ALL USING (public.is_admin(auth.uid()));

-- Settings Policies
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users view settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;

CREATE POLICY "Authenticated users view settings" ON public.settings
    FOR SELECT USING (auth.role() = 'authenticated' OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage settings" ON public.settings
    FOR ALL USING (public.is_admin(auth.uid()));

-- OTP Tables Hardening (revoke direct access)
ALTER TABLE public.signup_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon & auth access to signup_otps" ON public.signup_otps;
DROP POLICY IF EXISTS "Allow anon & auth access to password_reset_otps" ON public.password_reset_otps;
REVOKE ALL ON public.signup_otps FROM anon, authenticated;
REVOKE ALL ON public.password_reset_otps FROM anon, authenticated;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
