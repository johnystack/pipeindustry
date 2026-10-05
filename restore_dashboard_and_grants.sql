-- ==============================================================================
-- RESTORE DASHBOARD DATA & RPC FUNCTION PERMISSIONS
-- ==============================================================================
-- Run this in your Supabase SQL Editor.
-- It restores execution permissions for logged-in users so the dashboard
-- and active investment data load properly.

-- 1. Grant execute permissions to authenticated users, anon, and service role
GRANT EXECUTE ON FUNCTION public.get_dashboard_data(UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_active_referrals_count(UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.claim_investment_assets(UUID) TO authenticated, anon, service_role;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'withdraw_investment_to_balance'
    ) THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.withdraw_investment_to_balance(UUID, UUID, NUMERIC) TO authenticated, anon, service_role';
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Fallback if signature has 2 parameters
    BEGIN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.withdraw_investment_to_balance(UUID, UUID) TO authenticated, anon, service_role';
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

-- 2. Ensure functions run with elevated SECURITY DEFINER privileges
ALTER FUNCTION public.get_dashboard_data(UUID) SECURITY DEFINER;
ALTER FUNCTION public.get_active_referrals_count(UUID) SECURITY DEFINER;
ALTER FUNCTION public.claim_investment_assets(UUID) SECURITY DEFINER;

-- 3. Notify PostgREST to reload the schema cache immediately
NOTIFY pgrst, 'reload schema';
