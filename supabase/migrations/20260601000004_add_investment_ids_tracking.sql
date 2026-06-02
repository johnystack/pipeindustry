
-- Add column to track which investments are associated with a withdrawal
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS associated_investment_ids UUID ARRAY DEFAULT '{}';

-- Update execute_withdrawal to store the investment IDs
CREATE OR REPLACE FUNCTION public.execute_withdrawal(
  p_user_id UUID,
  p_amount NUMERIC,
  p_fee NUMERIC,
  p_description TEXT,
  p_address TEXT,
  p_pending_investment_ids UUID ARRAY
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance NUMERIC;
BEGIN
  -- 1. Lock the profile row for update to prevent concurrent balance changes
  SELECT withdrawable_balance INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- 2. Verify sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient assets for this withdrawal.');
  END IF;

  -- 3. Mark investments as commission paid
  IF array_length(p_pending_investment_ids, 1) > 0 THEN
    UPDATE public.investments
    SET commission_paid = true
    WHERE id = ANY(p_pending_investment_ids)
    AND user_id = p_user_id;
  END IF;

  -- 4. Deduct balance
  UPDATE public.profiles
  SET withdrawable_balance = withdrawable_balance - p_amount
  WHERE id = p_user_id;

  -- 5. Create transaction record with associated investment IDs
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    fee,
    status,
    description,
    withdrawal_type,
    crypto,
    address,
    associated_investment_ids
  ) VALUES (
    p_user_id,
    'withdrawal',
    p_amount,
    p_fee,
    'pending',
    p_description,
    'to_bank',
    'NGN',
    p_address,
    p_pending_investment_ids
  );

  RETURN jsonb_build_object('success', true, 'message', 'Withdrawal processed successfully.');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update reject_withdrawal to revert commission_paid status
CREATE OR REPLACE FUNCTION reject_withdrawal(
  withdrawal_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_amount NUMERIC;
  v_user_id UUID;
  v_status TEXT;
  v_investment_ids UUID ARRAY;
BEGIN
  -- Get withdrawal details and lock the row
  SELECT amount, user_id, status, associated_investment_ids 
  INTO v_amount, v_user_id, v_status, v_investment_ids
  FROM public.transactions
  WHERE id = withdrawal_id
  FOR UPDATE;

  -- Only refund if it was pending
  IF v_status = 'pending' THEN
    -- 1. Refund the balance to the user
    UPDATE public.profiles
    SET withdrawable_balance = withdrawable_balance + v_amount
    WHERE id = v_user_id;

    -- 2. Revert commission_paid status on investments
    IF v_investment_ids IS NOT NULL AND array_length(v_investment_ids, 1) > 0 THEN
      UPDATE public.investments
      SET commission_paid = false
      WHERE id = ANY(v_investment_ids)
      AND user_id = v_user_id;
    END IF;

    -- 3. Update status to denied
    UPDATE public.transactions
    SET status = 'denied'
    WHERE id = withdrawal_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
