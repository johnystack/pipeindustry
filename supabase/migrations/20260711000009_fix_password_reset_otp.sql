-- Fix password reset OTP — remove pg_net dependency
-- Frontend generates code + calls edge function to send email
-- DB only stores and verifies the code

-- New function: store_password_reset_otp
-- Called by frontend AFTER it has sent the email via edge function
CREATE OR REPLACE FUNCTION public.store_password_reset_otp(p_email TEXT, p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_email TEXT := LOWER(TRIM(p_email));
    v_user_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE LOWER(TRIM(email)) = v_email)
    INTO v_user_exists;

    IF NOT v_user_exists THEN
        RETURN jsonb_build_object('success', false, 'message', 'No account found with that email.');
    END IF;

    -- Expire old OTPs
    UPDATE public.password_reset_otps
    SET expires_at = NOW() - INTERVAL '1 second'
    WHERE LOWER(TRIM(email)) = v_email AND verified = FALSE;

    -- Store new OTP — 10 min expiry
    INSERT INTO public.password_reset_otps (email, code, expires_at, verified)
    VALUES (v_email, TRIM(p_code), NOW() + INTERVAL '10 minutes', FALSE);

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- verify_password_reset_otp — unchanged logic, just cleaned up
CREATE OR REPLACE FUNCTION public.verify_password_reset_otp(p_email TEXT, p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_email  TEXT := LOWER(TRIM(p_email));
    v_otp_id UUID;
BEGIN
    SELECT id INTO v_otp_id
    FROM public.password_reset_otps
    WHERE LOWER(TRIM(email)) = v_email
      AND TRIM(code) = TRIM(p_code)
      AND expires_at > NOW()
      AND verified = FALSE
    ORDER BY created_at DESC LIMIT 1;

    IF v_otp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid or expired code.');
    END IF;

    UPDATE public.password_reset_otps SET verified = TRUE WHERE id = v_otp_id;

    RETURN jsonb_build_object('success', true, 'message', 'Identity verified.', 'otp_id', v_otp_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- reset_password_with_otp — unchanged
CREATE OR REPLACE FUNCTION public.reset_password_with_otp(
    p_email TEXT,
    p_otp_id UUID,
    p_new_password TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_verified BOOLEAN;
    v_user_id  UUID;
BEGIN
    SELECT verified INTO v_verified
    FROM public.password_reset_otps
    WHERE id = p_otp_id
      AND LOWER(TRIM(email)) = LOWER(TRIM(p_email))
      AND created_at > NOW() - INTERVAL '15 minutes';

    IF v_verified IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized. Please start over.');
    END IF;

    SELECT id INTO v_user_id FROM public.profiles WHERE LOWER(TRIM(email)) = LOWER(TRIM(p_email));

    UPDATE auth.users
    SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
        updated_at = NOW()
    WHERE id = v_user_id;

    DELETE FROM public.password_reset_otps WHERE id = p_otp_id;

    RETURN jsonb_build_object('success', true, 'message', 'Password updated successfully.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.store_password_reset_otp(TEXT, TEXT)   TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_password_reset_otp(TEXT, TEXT)   TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_password_with_otp(TEXT, UUID, TEXT) TO anon, authenticated, service_role;
