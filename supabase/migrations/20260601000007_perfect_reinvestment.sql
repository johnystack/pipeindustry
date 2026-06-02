-- Perfect Reinvestment Migration
-- 1. Add reinvested column to investments if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investments' AND column_name = 'reinvested') THEN
        ALTER TABLE public.investments ADD COLUMN reinvested BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Update claim_investment_assets to auto-deduct commission on 6th claim
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
    v_fee_percent NUMERIC;
    v_commission NUMERIC;
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
    v_payout_amount := v_investment.amount * 0.25;

    -- Update investment
    UPDATE public.investments 
    SET 
        claimed_amount = COALESCE(claimed_amount, 0) + v_payout_amount,
        last_claim_at = v_last_reference_date + (v_interval_days || ' days')::interval
    WHERE id = p_investment_id;

    -- Update user balance
    UPDATE public.profiles 
    SET withdrawable_balance = COALESCE(withdrawable_balance, 0) + v_payout_amount
    WHERE id = v_investment.user_id;

    -- Log profit transaction
    INSERT INTO public.transactions (user_id, type, amount, status, description, reference)
    VALUES (
        v_investment.user_id, 
        'profit',
        v_payout_amount, 
        'completed', 
        '4-day interval asset claim (capital + profit) from ' || v_investment.plan_name,
        'CLAIM-' || p_investment_id || '-' || extract(epoch from v_now)
    );

    -- Check if it was the final claim (6th claim at 24 days)
    IF (COALESCE(v_investment.claimed_amount, 0) + v_payout_amount) >= (v_investment.amount * 1.5) THEN
        -- 1. Deduct commission automatically
        SELECT withdrawal_fee_percent INTO v_fee_percent FROM public.settings WHERE id = 1;
        v_commission := (v_investment.amount * 1.5) * (COALESCE(v_fee_percent, 6.67) / 100);
        
        UPDATE public.profiles 
        SET withdrawable_balance = withdrawable_balance - v_commission
        WHERE id = v_investment.user_id;

        -- 2. Log commission withdrawal
        INSERT INTO public.transactions (user_id, type, amount, status, description, reference)
        VALUES (
            v_investment.user_id, 
            'withdrawal',
            v_commission, 
            'completed', 
            'Automated trade commission for ' || v_investment.plan_name,
            'COMM-' || p_investment_id || '-' || extract(epoch from v_now)
        );

        -- 3. Mark as completed and commission paid
        UPDATE public.investments 
        SET 
            status = 'completed',
            commission_paid = true
        WHERE id = p_investment_id;
        
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'Final claim successful. Commission of ₦' || v_commission || ' deducted automatically.',
            'claimed_amount', v_payout_amount,
            'commission_deducted', v_commission
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Successfully claimed ₦' || v_payout_amount || ' (Capital + Profit)',
        'claimed_amount', v_payout_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Implement reinvest_capital_from_balance RPC with instant activation
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
  -- 1. Get old investment and lock for update
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

  -- 2. Get profile balance and lock
  SELECT withdrawable_balance INTO v_balance 
  FROM public.profiles 
  WHERE id = p_user_id 
  FOR UPDATE;

  IF v_balance < v_old_investment.amount THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient balance to reinvest capital of ₦' || v_old_investment.amount);
  END IF;

  -- 3. Deduct from balance
  UPDATE public.profiles
  SET withdrawable_balance = withdrawable_balance - v_old_investment.amount
  WHERE id = p_user_id;

  -- 4. Mark old as reinvested
  UPDATE public.investments
  SET reinvested = true
  WHERE id = p_old_investment_id;

  -- 5. Create new investment - INSTANTLY ACTIVE
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
    due_date,
    created_at
  )
  VALUES (
    p_user_id,
    v_old_investment.plan_id,
    v_old_investment.plan_name,
    v_old_investment.amount,
    v_old_investment.crypto,
    'active', -- Skip pending, funds are already verified internally
    v_old_investment.amount * 0.5,
    (v_old_investment.amount * 0.5) / 24,
    24,
    true,
    v_now,
    v_now + INTERVAL '24 days',
    v_now
  );

  -- 6. Log transaction
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    status,
    description,
    reference
  )
  VALUES (
    p_user_id,
    'investment',
    v_old_investment.amount,
    'completed',
    'Capital reinvestment into ' || v_old_investment.plan_name || ' (Auto-Activated)',
    'REINV-' || p_old_investment_id || '-' || extract(epoch from v_now)
  );

  RETURN jsonb_build_object('success', true, 'message', 'Capital successfully reinvested! New position is now active.');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
