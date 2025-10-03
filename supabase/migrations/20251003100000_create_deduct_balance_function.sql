CREATE OR REPLACE FUNCTION deduct_balance(
    p_user_id UUID,
    p_amount DECIMAL
)
RETURNS VOID AS $$
DECLARE
    v_current_withdrawable_balance DECIMAL;
BEGIN
    -- Get the current withdrawable_balance of the user
    SELECT withdrawable_balance INTO v_current_withdrawable_balance FROM profiles WHERE id = p_user_id;

    -- Check if the user has sufficient withdrawable_balance
    IF v_current_withdrawable_balance >= p_amount THEN
        -- Deduct the amount from the user's withdrawable_balance
        UPDATE profiles
        SET withdrawable_balance = withdrawable_balance - p_amount
        WHERE id = p_user_id;
    ELSE
        RAISE EXCEPTION 'Insufficient balance';
    END IF;
END;
$$ LANGUAGE plpgsql;
