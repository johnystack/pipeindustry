-- Atomic function to reinvest capital/profit
CREATE OR REPLACE FUNCTION public.reinvest_investment(
  p_user_id UUID,
  p_old_investment_id UUID,
  p_amount_to_reinvest NUMERIC,
  p_amount_to_balance NUMERIC
)
RETURNS JSONB AS $$
BEGIN
  -- 1. Lock profile
  PERFORM 1 FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  -- 2. Update balance if any
  IF p_amount_to_balance > 0 THEN
    UPDATE public.profiles
    SET withdrawable_balance = withdrawable_balance + p_amount_to_balance
    WHERE id = p_user_id;
  END IF;

  -- 3. Mark old investment as completed
  UPDATE public.investments
  SET 
    status = 'completed',
    reinvested = true,
    bonus = 0
  WHERE id = p_old_investment_id AND user_id = p_user_id;

  -- 4. Create new investment
  INSERT INTO public.investments (
    user_id,
    plan_name,
    amount,
    crypto,
    status,
    reinvested
  )
  SELECT 
    p_user_id,
    plan_name,
    p_amount_to_reinvest,
    crypto,
    'pending',
    true
  FROM public.investments
  WHERE id = p_old_investment_id;

  RETURN jsonb_build_object('success', true, 'message', 'Re-investment processed successfully.');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic function to withdraw investment to balance
CREATE OR REPLACE FUNCTION public.withdraw_investment_to_balance(
  p_user_id UUID,
  p_investment_id UUID,
  p_total_return NUMERIC
)
RETURNS JSONB AS $$
BEGIN
  -- 1. Lock profile
  UPDATE public.profiles
  SET withdrawable_balance = withdrawable_balance + p_total_return
  WHERE id = p_user_id;

  -- 2. Mark investment as withdrawn
  UPDATE public.investments
  SET 
    status = 'withdrawn',
    bonus = 0
  WHERE id = p_investment_id AND user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Funds added to balance successfully.');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
