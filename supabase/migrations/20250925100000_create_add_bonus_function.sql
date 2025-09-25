
CREATE OR REPLACE FUNCTION add_bonus(user_id_input uuid, bonus_amount_input numeric)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET withdrawable_balance = withdrawable_balance + bonus_amount_input
  WHERE id = user_id_input;
END;
$$ LANGUAGE plpgsql;
