
-- Atomic withdrawal function to handle high traffic and prevent balance errors
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

  -- 5. Create transaction record
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
