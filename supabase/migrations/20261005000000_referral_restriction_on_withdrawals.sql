-- Migration: Add Active Referral Restriction on Withdrawals
-- 1. Ensure referral_bonus_paid column exists on investments to decouple referral bonus tracking from trade fee commission_paid
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS referral_bonus_paid BOOLEAN DEFAULT FALSE;

-- Synchronize any existing investments where commission_paid was set by the referral bonus trigger
UPDATE public.investments 
SET referral_bonus_paid = true 
WHERE commission_paid = true AND COALESCE(claimed_amount, 0) < (amount * 1.25);

UPDATE public.investments 
SET commission_paid = false 
WHERE referral_bonus_paid = true AND COALESCE(claimed_amount, 0) < (amount * 1.25);

-- 2. Update handle_referral_bonus function to use referral_bonus_paid
CREATE OR REPLACE FUNCTION public.handle_referral_bonus()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_id UUID;
    v_active_referrals_count INTEGER;
    v_bonus_percent NUMERIC := 0;
    v_bonus_amount NUMERIC := 0;
    v_investor_name TEXT;
BEGIN
    -- Only process when an investment becomes 'active'
    IF (TG_OP = 'INSERT' AND NEW.status = 'active') OR
       (TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status = 'active') THEN

        -- Check if bonus was already paid for this investment
        IF COALESCE(NEW.referral_bonus_paid, false) = true THEN
            RETURN NEW;
        END IF;

        -- Ensure investor's profile has has_invested set to true
        UPDATE public.profiles 
        SET has_invested = true 
        WHERE id = NEW.user_id;

        -- Find the referrer
        SELECT referred_by INTO v_referrer_id 
        FROM public.profiles 
        WHERE id = NEW.user_id;

        -- If there is a referrer
        IF v_referrer_id IS NOT NULL THEN
            
            -- Count ONLY distinct referred users who have at least one approved (active or completed) investment
            SELECT COUNT(DISTINCT user_id) INTO v_active_referrals_count 
            FROM public.investments 
            WHERE status IN ('active', 'completed') 
              AND user_id IN (
                  SELECT id FROM public.profiles WHERE referred_by = v_referrer_id
              );

            -- Determine bonus percentage based on tiers:
            -- 2 active referrals -> 5%
            -- 3-5 active referrals -> 10%
            -- 6-8 active referrals -> 15%
            -- 9+ active referrals -> 20%
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

            -- If eligible for bonus
            IF v_bonus_percent > 0 AND NEW.amount > 0 THEN
                v_bonus_amount := (NEW.amount * v_bonus_percent) / 100;

                -- Get investor name for description
                SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), username, 'Referral') 
                INTO v_investor_name 
                FROM public.profiles WHERE id = NEW.user_id;

                -- Insert transaction record for the referrer
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

                -- Update referrer's referral_earnings
                UPDATE public.profiles 
                SET referral_earnings = COALESCE(referral_earnings, 0) + v_bonus_amount
                WHERE id = v_referrer_id;

                -- Mark this investment as referral_bonus_paid
                UPDATE public.investments 
                SET referral_bonus_paid = true 
                WHERE id = NEW.id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Helper function to count active referrals (referred users with approved 'active' or 'completed' investments)
DROP FUNCTION IF EXISTS public.get_active_referrals_count(UUID);
CREATE OR REPLACE FUNCTION public.get_active_referrals_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT user_id) INTO v_count
    FROM public.investments
    WHERE status IN ('active', 'completed')
      AND user_id IN (
          SELECT id FROM public.profiles WHERE referred_by = p_user_id
      );
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. Update get_dashboard_data to return active_referrals_count
DROP FUNCTION IF EXISTS public.get_dashboard_data(UUID);
CREATE OR REPLACE FUNCTION public.get_dashboard_data(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_active_ref_count INTEGER;
BEGIN
    -- Call the function to update due investments
    PERFORM public.update_due_investments();

    v_active_ref_count := public.get_active_referrals_count(p_user_id);

    RETURN json_build_object(
        'profile', (SELECT row_to_json(p) FROM public.profiles WHERE id = p_user_id),
        'investments', (SELECT json_agg(row_to_json(i)) FROM public.investments i WHERE user_id = p_user_id),
        'recent_transactions', (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM public.transactions WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 5) t),
        'active_referrals_count', v_active_ref_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Comprehensive claim_investment_assets function enforcing active referral restriction:
-- - Plan: 24 days, 6 milestone intervals of 4 days each (25% capital per interval).
-- - Intervals 1-4: 100% capital returned.
-- - Interval 5: 25% return (50% of the 50% profit = half profit).
-- - Interval 6: 25% return (remaining 50% of profit).
-- - If user has 0 active referrals:
--     * Max allowed claims: 5 intervals (100% capital + half profit = 125% of investment).
--     * Company fee is deducted on the 5th withdrawal (or bulk cycle end claim).
--     * 6th interval is strictly locked until the user obtains at least one active referral.
--     * If user waits until the end of the 24-day cycle without earlier claims, bulk claiming allows max 5 intervals (half profit),
--       and the company fee is deducted immediately from that payout.
-- - If user has >= 1 active referrals:
--     * All 6 intervals can be claimed (150% total return).
--     * Company fee is deducted on the 6th withdrawal (or bulk cycle end claim) if not previously paid.
-- - If user reaches stage 5 with 0 referrals, pays fee, and LATER gets an active referral:
--     * Stage 6 unlocks. Payout is made without duplicate fee deduction, and investment completes.
DROP FUNCTION IF EXISTS public.claim_investment_assets(UUID);
CREATE OR REPLACE FUNCTION public.claim_investment_assets(p_investment_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_investment RECORD;
    v_user_id UUID;
    v_active_referrals_count INTEGER;
    v_milestone_val NUMERIC;
    v_stages_claimed INTEGER;
    v_days_passed INTEGER;
    v_milestones_reached INTEGER;
    v_max_allowed_stages INTEGER;
    v_stages_to_claim INTEGER;
    v_new_stage INTEGER;
    v_payout_amount NUMERIC;
    v_new_claimed_amount NUMERIC;
    v_fee_percent NUMERIC;
    v_commission NUMERIC;
    v_deduct_commission BOOLEAN := false;
    v_interval_days INTEGER := 4;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
    v_next_milestone_day INTEGER;
    v_days_remaining INTEGER;
BEGIN
    -- 1. Get investment details and lock row
    SELECT * INTO v_investment FROM public.investments WHERE id = p_investment_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Investment not found.');
    END IF;
    
    IF v_investment.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Investment is not active.');
    END IF;

    IF v_investment.approved_at IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Investment has not been approved yet.');
    END IF;

    -- 2. Count active referrals
    v_user_id := v_investment.user_id;
    v_active_referrals_count := public.get_active_referrals_count(v_user_id);

    -- 3. Milestone calculation
    -- Each 4-day block is 25% of initial capital
    v_milestone_val := v_investment.amount * 0.25;
    v_stages_claimed := round(COALESCE(v_investment.claimed_amount, 0) / v_milestone_val);
    v_days_passed := floor(extract(epoch from (v_now - v_investment.approved_at)) / 86400);
    v_milestones_reached := LEAST(6, floor(v_days_passed / v_interval_days));

    -- Determine max allowed stages for this user
    IF v_active_referrals_count = 0 THEN
        v_max_allowed_stages := 5; -- Capital + Half of Profit (125% total)
    ELSE
        v_max_allowed_stages := 6; -- Capital + Full Profit (150% total)
    END IF;

    -- Check if user is trying to claim stage 6 without active referrals
    IF v_stages_claimed >= v_max_allowed_stages THEN
        IF v_active_referrals_count = 0 THEN
            RETURN jsonb_build_object(
                'success', false, 
                'message', 'Active referral required: You have withdrawn your capital and half of your profit (Stage 5/6). You must refer at least one active trader with an approved investment to unlock and withdraw your final profit (Stage 6).'
            );
        ELSE
            RETURN jsonb_build_object('success', false, 'message', 'All investment milestones have already been claimed.');
        END IF;
    END IF;

    -- Check if a milestone is ready based on time
    IF v_milestones_reached <= v_stages_claimed THEN
        v_next_milestone_day := (v_stages_claimed + 1) * v_interval_days;
        v_days_remaining := GREATEST(1, v_next_milestone_day - v_days_passed);
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'You can only claim assets every ' || v_interval_days || ' days. ' || v_days_remaining || ' day(s) remaining until next milestone.'
        );
    END IF;

    -- Calculate how many stages to claim in this execution
    v_stages_to_claim := LEAST(v_milestones_reached, v_max_allowed_stages) - v_stages_claimed;
    IF v_stages_to_claim <= 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'No new claimable milestones ready.');
    END IF;

    v_payout_amount := v_stages_to_claim * v_milestone_val;
    v_new_stage := v_stages_claimed + v_stages_to_claim;
    v_new_claimed_amount := COALESCE(v_investment.claimed_amount, 0) + v_payout_amount;

    -- 4. Calculate company commission fee
    SELECT COALESCE(withdrawal_fee_percent, 6.67) INTO v_fee_percent FROM public.settings WHERE id = 1;
    v_commission := (v_investment.amount * 1.5) * (v_fee_percent / 100);

    -- Commission deduction rules:
    -- If user has 0 active referrals: Deduct on the 5th milestone withdrawal (or earlier if bulk claiming reaches >= 5)
    -- If user has >= 1 active referrals: Deduct on the 6th milestone withdrawal (or bulk claiming reaches 6)
    IF v_active_referrals_count = 0 AND v_new_stage >= 5 AND COALESCE(v_investment.commission_paid, false) = false THEN
        v_deduct_commission := true;
    ELSIF v_new_stage >= 6 AND COALESCE(v_investment.commission_paid, false) = false THEN
        v_deduct_commission := true;
    ELSE
        v_deduct_commission := false;
    END IF;

    -- 5. Update user profile balance
    IF v_deduct_commission THEN
        UPDATE public.profiles 
        SET withdrawable_balance = COALESCE(withdrawable_balance, 0) + GREATEST(0, v_payout_amount - v_commission)
        WHERE id = v_user_id;
    ELSE
        UPDATE public.profiles 
        SET withdrawable_balance = COALESCE(withdrawable_balance, 0) + v_payout_amount
        WHERE id = v_user_id;
    END IF;

    -- 6. Log transactions
    -- Profit payout transaction
    INSERT INTO public.transactions (user_id, type, amount, status, description, reference)
    VALUES (
        v_user_id, 
        'profit', 
        v_payout_amount, 
        'completed', 
        'Milestone ' || v_new_stage || '/6 asset claim (' || v_stages_to_claim || ' stage(s)) from ' || v_investment.plan_name, 
        'CLAIM-' || p_investment_id || '-' || extract(epoch from v_now)
    );

    -- Commission deduction transaction
    IF v_deduct_commission THEN
        INSERT INTO public.transactions (user_id, type, amount, status, description, reference)
        VALUES (
            v_user_id, 
            'withdrawal', 
            v_commission, 
            'completed', 
            'Automated trade commission for ' || v_investment.plan_name || ' (Milestone ' || v_new_stage || ')', 
            'COMM-' || p_investment_id || '-' || extract(epoch from v_now)
        );
    END IF;

    -- 7. Update investment record
    UPDATE public.investments 
    SET 
        claimed_amount = v_new_claimed_amount,
        last_claim_at = v_investment.approved_at + ((v_new_stage * v_interval_days) || ' days')::interval,
        commission_paid = CASE WHEN v_deduct_commission THEN true ELSE commission_paid END,
        status = CASE WHEN v_new_stage >= 6 THEN 'completed' ELSE 'active' END
    WHERE id = p_investment_id;

    -- 8. Return comprehensive success response
    IF v_new_stage >= 6 THEN
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'Final claim successful: ₦' || v_payout_amount || ' credited. Plan cycle concluded.' || 
                       CASE WHEN v_deduct_commission THEN ' Commission of ₦' || v_commission || ' deducted.' ELSE '' END,
            'claimed_amount', v_payout_amount,
            'stages_claimed', v_new_stage,
            'cycle_completed', true
        );
    ELSIF v_new_stage = 5 AND v_active_referrals_count = 0 THEN
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'Claim successful: ₦' || v_payout_amount || ' credited (Capital + Half Profit).' || 
                       CASE WHEN v_deduct_commission THEN ' Company fee of ₦' || v_commission || ' deducted.' ELSE '' END || 
                       ' Notice: An active referral is required to unlock your final profit withdrawal (Stage 6).',
            'claimed_amount', v_payout_amount,
            'stages_claimed', v_new_stage,
            'referral_required', true
        );
    ELSE
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'Successfully claimed ₦' || v_payout_amount || ' (Stage ' || v_new_stage || '/6).',
            'claimed_amount', v_payout_amount,
            'stages_claimed', v_new_stage,
            'referral_required', false
        );
    END IF;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update withdraw_investment_to_balance function to enforce the same rule safely
DROP FUNCTION IF EXISTS public.withdraw_investment_to_balance(UUID, UUID, NUMERIC);
DROP FUNCTION IF EXISTS public.withdraw_investment_to_balance(UUID, UUID);
CREATE OR REPLACE FUNCTION public.withdraw_investment_to_balance(
  p_user_id UUID,
  p_investment_id UUID,
  p_total_return NUMERIC DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_investment RECORD;
  v_active_ref_count INTEGER;
  v_fee_percent NUMERIC;
  v_commission NUMERIC;
  v_already_claimed NUMERIC;
  v_target_total NUMERIC;
  v_unclaimed_amount NUMERIC;
  v_payout NUMERIC;
  v_deduct_commission BOOLEAN := false;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- 1. Get investment and lock
  SELECT * INTO v_investment 
  FROM public.investments 
  WHERE id = p_investment_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Investment not found.');
  END IF;

  -- 2. Count active referrals
  v_active_ref_count := public.get_active_referrals_count(p_user_id);
  v_already_claimed := COALESCE(v_investment.claimed_amount, 0);
  
  -- 3. Calculate allowed target total (1.25x for 0 referrals, 1.5x for >=1 referrals)
  IF v_active_ref_count = 0 THEN
    v_target_total := v_investment.amount * 1.25;
  ELSE
    v_target_total := v_investment.amount * 1.5;
  END IF;

  -- 4. Calculate unclaimed remainder
  v_unclaimed_amount := GREATEST(0, v_target_total - v_already_claimed);

  IF v_unclaimed_amount <= 0 THEN
    IF v_active_ref_count = 0 THEN
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'You have already withdrawn your capital and half of your profit (Stage 5/6). An active referral with an approved investment is required to unlock your final profit withdrawal (Stage 6).'
      );
    ELSE
      RETURN jsonb_build_object('success', false, 'message', 'All investment funds have already been claimed and settled.');
    END IF;
  END IF;

  -- 5. Calculate company commission fee
  SELECT COALESCE(withdrawal_fee_percent, 6.67) INTO v_fee_percent FROM public.settings WHERE id = 1;
  v_commission := (v_investment.amount * 1.5) * (v_fee_percent / 100);

  IF COALESCE(v_investment.commission_paid, false) = false THEN
    v_deduct_commission := true;
    v_payout := GREATEST(0, v_unclaimed_amount - v_commission);
  ELSE
    v_deduct_commission := false;
    v_payout := v_unclaimed_amount;
  END IF;

  -- 6. Update profile balance
  UPDATE public.profiles
  SET withdrawable_balance = COALESCE(withdrawable_balance, 0) + v_payout
  WHERE id = p_user_id;

  -- 7. Update investment status
  -- If user has >=1 active referrals and has now reached 1.5x return, mark completed.
  -- Otherwise, if user has 0 referrals, keep as active (stage 5 locked until referral obtained).
  UPDATE public.investments
  SET 
    status = CASE WHEN v_active_ref_count > 0 AND (v_already_claimed + v_unclaimed_amount) >= (amount * 1.5) THEN 'completed' ELSE 'active' END,
    claimed_amount = v_already_claimed + v_unclaimed_amount,
    commission_paid = CASE WHEN v_deduct_commission THEN true ELSE commission_paid END,
    bonus = 0
  WHERE id = p_investment_id AND user_id = p_user_id;

  -- 8. Log transactions
  INSERT INTO public.transactions (user_id, type, amount, status, description, reference)
  VALUES (
    p_user_id, 
    'profit', 
    v_unclaimed_amount, 
    'completed', 
    'Asset withdrawal from ' || v_investment.plan_name || ' to balance' || 
    CASE WHEN v_active_ref_count = 0 THEN ' (Capital + Half Profit)' ELSE ' (Full Maturity)' END, 
    'WITHDRAW-' || p_investment_id || '-' || extract(epoch from v_now)
  );

  IF v_deduct_commission THEN
    INSERT INTO public.transactions (user_id, type, amount, status, description, reference)
    VALUES (
      p_user_id, 
      'withdrawal', 
      v_commission, 
      'completed', 
      'Automated trade commission for ' || v_investment.plan_name, 
      'COMM-' || p_investment_id || '-' || extract(epoch from v_now)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'message', '₦' || v_payout || ' credited to withdrawable balance successfully.' ||
               CASE WHEN v_deduct_commission THEN ' Commission of ₦' || v_commission || ' deducted.' ELSE '' END ||
               CASE WHEN v_active_ref_count = 0 THEN ' (Active referral required to unlock remaining 50% profit).' ELSE '' END
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
