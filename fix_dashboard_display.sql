-- ==============================================================================
-- FIX DASHBOARD DISPLAY & SOLVE "COLUMN 'p' DOES NOT EXIST" ERROR
-- ==============================================================================
-- Run this in your Supabase SQL Editor.
-- This script fixes the exact syntax error inside get_dashboard_data that was
-- preventing the dashboard from loading users' investments and balances.

CREATE OR REPLACE FUNCTION public.get_dashboard_data(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_active_ref_count INTEGER;
    v_profile JSON;
    v_investments JSON;
    v_transactions JSON;
BEGIN
    -- 1. Conclude any completed investments
    PERFORM public.update_due_investments();

    -- 2. Count active referrals
    v_active_ref_count := public.get_active_referrals_count(p_user_id);

    -- 3. Fetch user profile safely
    SELECT row_to_json(p) INTO v_profile
    FROM (SELECT * FROM public.profiles WHERE id = p_user_id) p;

    -- 4. Fetch all user investments (both active and pending), ordered newest first
    SELECT COALESCE(json_agg(row_to_json(i)), '[]'::json) INTO v_investments
    FROM (
        SELECT * FROM public.investments 
        WHERE user_id = p_user_id 
        ORDER BY created_at DESC
    ) i;

    -- 5. Fetch recent transactions
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_transactions
    FROM (
        SELECT * FROM public.transactions 
        WHERE user_id = p_user_id 
        ORDER BY created_at DESC 
        LIMIT 5
    ) t;

    -- 6. Return combined dashboard payload
    RETURN json_build_object(
        'profile', v_profile,
        'investments', v_investments,
        'recent_transactions', v_transactions,
        'active_referrals_count', COALESCE(v_active_ref_count, 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure execution permissions for all roles
GRANT EXECUTE ON FUNCTION public.get_dashboard_data(UUID) TO authenticated, anon, service_role;
ALTER FUNCTION public.get_dashboard_data(UUID) SECURITY DEFINER;

-- Force PostgREST to reload schema immediately
NOTIFY pgrst, 'reload schema';
