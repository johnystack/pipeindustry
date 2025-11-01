
CREATE OR REPLACE FUNCTION add_bonus_to_investment(investment_id_input uuid, bonus_amount_input numeric)
RETURNS void AS $$
BEGIN
  UPDATE public.investments
  SET bonus = bonus + bonus_amount_input
  WHERE id = investment_id_input;
END;
$$ LANGUAGE plpgsql;
