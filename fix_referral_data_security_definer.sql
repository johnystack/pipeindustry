-- ==============================================================================
-- FIX: RESTORE REFERRAL NETWORK VISIBILITY FOR USERS (SECURITY DEFINER)
-- ==============================================================================
-- Run this in your Supabase SQL Editor.
-- Problem: get_referral_data was created as SECURITY INVOKER (missing SECURITY DEFINER).
-- Because Row-Level Security (RLS) on profiles & investments prevents normal users
-- from querying other users' rows, regular users were seeing 0 referrals in their
-- network, whereas the admin account bypassed RLS and saw everything.
--
-- Solution: Add SECURITY DEFINER to get_referral_data with strict auth check,
-- allowing regular users to safely see their own referred users without breaking RLS.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_referral_data(p_user_id uuid)
RETURNS json AS $$
DECLARE
    v_active_count INTEGER;
    v_total_signups INTEGER;
    v_current_tier TEXT;
    v_next_tier_req INTEGER;
    v_current_percent INTEGER;
    v_profile json;
    v_recent_referrals json;
    v_commission_earnings json;
BEGIN
    -- 1. Security Check: Only the account owner or verified admin can query referral data
    IF auth.uid() IS NULL OR (auth.uid() != p_user_id AND NOT public.is_admin(auth.uid())) THEN
        RAISE EXCEPTION 'Unauthorized: You can only view your own referral network.';
    END IF;

    -- 2. Conclude any due investments
    PERFORM public.update_due_investments();

    -- 3. Count strictly referred users who have at least one approved investment ('active' or 'completed')
    SELECT COUNT(DISTINCT user_id) INTO v_active_count 
    FROM public.investments 
    WHERE status IN ('active', 'completed')
      AND user_id IN (SELECT id FROM public.profiles WHERE referred_by = p_user_id);

    -- 4. Count total registered signups under this user
    SELECT COUNT(*) INTO v_total_signups 
    FROM public.profiles 
    WHERE referred_by = p_user_id;

    -- 5. Determine tier based strictly on approved active investors
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
        v_next_tier_req := 0; -- Max reached
        v_current_percent := 20;
    END IF;

    -- 6. Fetch user profile
    SELECT row_to_json(p) INTO v_profile
    FROM public.profiles p 
    WHERE id = p_user_id;

    -- 7. Fetch referred users (safe presentation attributes: name, username, joinDate, investment status/commission)
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
    ) ORDER BY u.created_at DESC), '[]'::json) INTO v_recent_referrals
    FROM public.profiles u 
    WHERE u.referred_by = p_user_id;

    -- 8. Fetch commission earnings transactions for this user
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json) INTO v_commission_earnings
    FROM public.transactions t 
    WHERE t.user_id = p_user_id AND t.type = 'referral';

    RETURN json_build_object(
        'profile', v_profile,
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
        'recent_referrals', v_recent_referrals,
        'commission_earnings', v_commission_earnings
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Grant execution permissions to authenticated users and service_role
GRANT EXECUTE ON FUNCTION public.get_referral_data(uuid) TO authenticated, service_role;

-- Also ensure claim_referral_earnings has SECURITY DEFINER and execution permissions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.claim_referral_earnings(UUID) TO authenticated, service_role;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
