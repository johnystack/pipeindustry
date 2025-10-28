CREATE OR REPLACE FUNCTION approve_withdrawal_with_receipt(
  withdrawal_id UUID,
  receipt_url TEXT
)
RETURNS VOID AS $$
DECLARE
  withdrawal_amount NUMERIC;
  user_id_to_update UUID;
BEGIN
  -- Get withdrawal details
  SELECT amount, user_id INTO withdrawal_amount, user_id_to_update
  FROM public.transactions
  WHERE id = withdrawal_id;

  -- Deduct amount from withdrawable balance
  UPDATE public.profiles
  SET withdrawable_balance = withdrawable_balance - withdrawal_amount
  WHERE id = user_id_to_update;

  -- Update withdrawal status and receipt_url
  UPDATE public.transactions
  SET status = 'approved', receipt_url = receipt_url
  WHERE id = withdrawal_id;
END;
$$ LANGUAGE plpgsql;