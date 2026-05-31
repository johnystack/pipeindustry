-- Migration to support 4-day interval claiming of TOTAL ASSETS (Capital + Profit)
-- 1. Add columns to track claims if they don't exist
ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS claimed_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_claim_at TIMESTAMP WITH TIME ZONE;

-- 2. Create the claim assets function
-- Logic: 24 day plan, 150% total return (100% capital + 50% profit)
-- Payout every 4 days (6 payouts total)
-- Each payout = (Amount * 1.5) / 6 = Amount * 0.25
CREATE OR REPLACE FUNCTION public.claim_investment_assets(p_investment_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_investment RECORD;
    v_user_id UUID;
    v_payout_amount NUMERIC;
    v_days_since_last_claim INTEGER;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
    v_last_reference_date TIMESTAMP WITH TIME ZONE;
    v_interval_days INTEGER := 4;
BEGIN
    -- Get investment details
    SELECT * INTO v_investment FROM public.investments WHERE id = p_investment_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Investment not found');
    END IF;
    
    IF v_investment.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Investment is not active');
    END IF;

    -- Determine the last time assets were claimed or approved
    v_last_reference_date := COALESCE(v_investment.last_claim_at, v_investment.approved_at);
    
    IF v_last_reference_date IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Investment has not been approved yet');
    END IF;

    -- Calculate days passed since last claim/approval
    v_days_since_last_claim := floor(extract(epoch from (v_now - v_last_reference_date)) / 86400);
    
    IF v_days_since_last_claim < v_interval_days THEN
        RETURN jsonb_build_object('success', false, 'message', 'You can only claim assets every ' || v_interval_days || ' days. ' || (v_interval_days - v_days_since_last_claim) || ' days remaining.');
    END IF;

    -- Calculate amount to claim (25% of the original investment amount per 4-day block)
    -- Total return is 1.5x (150%). 1.5 / 6 blocks = 0.25 (25%) per block.
    v_payout_amount := v_investment.amount * 0.25;

    -- Update investment
    -- We set last_claim_at to exactly 4 days after the previous reference date to keep intervals consistent
    UPDATE public.investments 
    SET 
        claimed_amount = COALESCE(claimed_amount, 0) + v_payout_amount,
        last_claim_at = v_last_reference_date + (v_interval_days || ' days')::interval
    WHERE id = p_investment_id;

    -- Update user balance
    UPDATE public.profiles 
    SET withdrawable_balance = COALESCE(withdrawable_balance, 0) + v_payout_amount
    WHERE id = v_investment.user_id;

    -- Log transaction
    INSERT INTO public.transactions (user_id, type, amount, status, description, reference)
    VALUES (
        v_investment.user_id, 
        'profit', -- Using 'profit' type for consistency with UI, even though it includes capital
        v_payout_amount, 
        'completed', 
        '4-day interval asset claim (capital + profit) from ' || v_investment.plan_name,
        'CLAIM-' || p_investment_id || '-' || extract(epoch from v_now)
    );

    -- Check if it was the final claim (6th claim at 24 days)
    IF v_investment.claimed_amount + v_payout_amount >= v_investment.amount * 1.5 THEN
        UPDATE public.investments SET status = 'completed' WHERE id = p_investment_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Successfully claimed ₦' || v_payout_amount || ' (Capital + Profit)',
        'claimed_amount', v_payout_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
