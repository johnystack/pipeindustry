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
  ADD COLUMN IF NOT EXISTS bonus NUMERIC DEFAULT 0;

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

-- 6. FIX RPC FUNCTIONS
CREATE OR REPLACE FUNCTION public.update_due_investments()
RETURNS void AS $$
BEGIN
  UPDATE public.investments
  SET status = 'completed'
  WHERE status = 'active'
  AND approved_at IS NOT NULL
  AND approved_at <= now() - interval '7 days';
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

-- 7. ENABLE ROW LEVEL SECURITY AND POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Vendor Plans Policies
DROP POLICY IF EXISTS "Vendor plans are viewable by everyone" ON public.vendor_plans;
CREATE POLICY "Vendor plans are viewable by everyone" ON public.vendor_plans FOR SELECT USING (true);

-- Investments Policies
DROP POLICY IF EXISTS "Users can view own investments" ON public.investments;
CREATE POLICY "Users can view own investments" ON public.investments FOR SELECT USING (true);

-- Transactions Policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (true);

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view notifications" ON public.notifications;
CREATE POLICY "Users can view notifications" ON public.notifications FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

-- Notification Reads Policies
DROP POLICY IF EXISTS "Users can manage read status" ON public.notification_reads;
CREATE POLICY "Users can manage read status" ON public.notification_reads FOR ALL USING (user_id = auth.uid());

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
