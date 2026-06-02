-- Atomic function to claim referral earnings
CREATE OR REPLACE FUNCTION public.claim_referral_earnings(
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_earnings NUMERIC;
BEGIN
  -- 1. Lock the profile row and get earnings
  SELECT referral_earnings INTO v_earnings
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- 2. Check if there are earnings to claim
  IF v_earnings IS NULL OR v_earnings <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'No referral earnings available to claim.');
  END IF;

  -- 3. Update profile: move earnings to withdrawable balance
  UPDATE public.profiles
  SET 
    withdrawable_balance = withdrawable_balance + v_earnings,
    referral_earnings = 0
  WHERE id = p_user_id;

  -- 4. Create transaction record
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    status,
    description,
    withdrawal_type
  ) VALUES (
    p_user_id,
    'withdrawal',
    v_earnings,
    'completed',
    'Referral earnings to withdrawable balance',
    'to_balance'
  );

  RETURN jsonb_build_object('success', true, 'message', 'Referral earnings claimed successfully.');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
