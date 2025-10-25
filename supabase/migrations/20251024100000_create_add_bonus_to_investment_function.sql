
CREATE OR REPLACE FUNCTION add_bonus_to_investment(user_id_input uuid, bonus_amount_input numeric)
RETURNS void AS $$
DECLARE
  latest_investment_id uuid;
BEGIN
  -- Find the latest investment for the user
  SELECT id INTO latest_investment_id
  FROM public.investments
  WHERE user_id = user_id_input
  ORDER BY created_at DESC
  LIMIT 1;

  -- Add the bonus to the latest investment
  IF latest_investment_id IS NOT NULL THEN
    UPDATE public.investments
    SET amount = amount + bonus_amount_input
    WHERE id = latest_investment_id;
  ELSE
    RAISE EXCEPTION 'No investment found for the user';
  END IF;
END;
$$ LANGUAGE plpgsql;
