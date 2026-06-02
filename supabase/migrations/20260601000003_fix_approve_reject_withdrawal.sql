-- Fix approve_withdrawal to NOT double-deduct balance
-- And create reject_withdrawal to refund balance on rejection

CREATE OR REPLACE FUNCTION approve_withdrawal(
  withdrawal_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- We NO LONGER deduct balance here because it's now deducted 
  -- at the time of request in execute_withdrawal() to prevent double spending.
  
  -- Update withdrawal status
  UPDATE public.transactions
  SET status = 'approved'
  WHERE id = withdrawal_id;
END;
$$ LANGUAGE plpgsql;

-- New function to handle rejection with refund
CREATE OR REPLACE FUNCTION reject_withdrawal(
  withdrawal_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_amount NUMERIC;
  v_user_id UUID;
  v_status TEXT;
BEGIN
  -- Get withdrawal details and lock the row
  SELECT amount, user_id, status INTO v_amount, v_user_id, v_status
  FROM public.transactions
  WHERE id = withdrawal_id
  FOR UPDATE;

  -- Only refund if it was pending
  IF v_status = 'pending' THEN
    -- 1. Refund the balance to the user
    UPDATE public.profiles
    SET withdrawable_balance = withdrawable_balance + v_amount
    WHERE id = v_user_id;

    -- 2. Update status to denied
    UPDATE public.transactions
    SET status = 'denied'
    WHERE id = withdrawal_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
