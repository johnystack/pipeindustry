CREATE OR REPLACE FUNCTION deduct_balance(
    p_user_id UUID,
    p_amount DECIMAL
)
RETURNS VOID AS $$
DECLARE
    v_current_balance DECIMAL;
BEGIN
    -- Get the current balance of the user
    SELECT balance INTO v_current_balance FROM profiles WHERE id = p_user_id;

    -- Check if the user has sufficient balance
    IF v_current_balance >= p_amount THEN
        -- Deduct the amount from the user's balance
        UPDATE profiles
        SET balance = balance - p_amount
        WHERE id = p_user_id;
    ELSE
        RAISE EXCEPTION 'Insufficient balance';
    END IF;
END;
$$ LANGUAGE plpgsql;
