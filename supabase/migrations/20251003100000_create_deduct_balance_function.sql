CREATE OR REPLACE FUNCTION deduct_bonus(
    p_investment_id UUID,
    p_amount DECIMAL
)
RETURNS VOID AS $$
DECLARE
    v_current_bonus DECIMAL;
BEGIN
    -- Get the current bonus of the investment
    SELECT bonus INTO v_current_bonus FROM investments WHERE id = p_investment_id;

    -- Check if the investment has sufficient bonus
    IF v_current_bonus >= p_amount THEN
        -- Deduct the amount from the investment's bonus
        UPDATE investments
        SET bonus = bonus - p_amount
        WHERE id = p_investment_id;
    ELSE
        RAISE EXCEPTION 'Insufficient bonus';
    END IF;
END;
$$ LANGUAGE plpgsql;
