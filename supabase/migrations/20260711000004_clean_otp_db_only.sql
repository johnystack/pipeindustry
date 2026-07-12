-- ============================================================
-- CLEAN OTP SYSTEM — DB only handles storage and verification
-- Email sending is handled by the frontend via Resend directly
-- This removes all pg_net / send_email_dispatch dependencies from OTP
-- ============================================================

-- Ensure the table exists
CREATE TABLE IF NOT EXISTS public.signup_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_signup_otps_email ON public.signup_otps(LOWER(email));

-- FUNCTION 1: Store a new OTP (called after frontend already sent the email)
-- Frontend sends email via Resend, then calls this to store the code
CREATE OR REPLACE FUNCTION public.store_signup_otp(p_email TEXT, p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_email TEXT := LOWER(TRIM(p_email));
BEGIN
    -- Expire all previous unverified OTPs for this email
    UPDATE public.signup_otps
    SET expires_at = NOW() - INTERVAL '1 second'
    WHERE LOWER(TRIM(email)) = v_email AND verified = FALSE;

    -- Insert the new OTP with 10 minute expiry
    INSERT INTO public.signup_otps (email, code, expires_at, verified)
    VALUES (v_email, TRIM(p_code), NOW() + INTERVAL '10 minutes', FALSE);

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION 2: Verify OTP and activate account
CREATE OR REPLACE FUNCTION public.verify_signup_otp(p_email TEXT, p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_otp_id UUID;
    v_user_id UUID;
    v_email TEXT := LOWER(TRIM(p_email));
    v_latest RECORD;
BEGIN
    -- Get the latest OTP for diagnostics
    SELECT * INTO v_latest
    FROM public.signup_otps
    WHERE LOWER(TRIM(email)) = v_email
    ORDER BY created_at DESC
    LIMIT 1;

    -- Find a valid matching OTP
    SELECT id INTO v_otp_id
    FROM public.signup_otps
    WHERE LOWER(TRIM(email)) = v_email
      AND TRIM(code) = TRIM(p_code)
      AND expires_at > NOW()
      AND verified = FALSE
    ORDER BY created_at DESC
    LIMIT 1;

    -- Return specific errors
    IF v_otp_id IS NULL THEN
        IF v_latest.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'message', 'No verification code found. Please request a new one.');
        ELSIF v_latest.verified = TRUE THEN
            RETURN jsonb_build_object('success', false, 'message', 'Code already used. Please request a new one.');
        ELSIF v_latest.expires_at <= NOW() THEN
            RETURN jsonb_build_object('success', false, 'message', 'Code has expired. Please request a new one.');
        ELSE
            RETURN jsonb_build_object('success', false, 'message', 'Incorrect code. Please check and try again.');
        END IF;
    END IF;

    -- Mark as verified
    UPDATE public.signup_otps SET verified = TRUE WHERE id = v_otp_id;

    -- Find and activate the user
    SELECT id INTO v_user_id
    FROM public.profiles
    WHERE LOWER(TRIM(email)) = v_email;

    IF v_user_id IS NOT NULL THEN
        UPDATE auth.users
        SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            confirmed_at = COALESCE(confirmed_at, NOW()),
            updated_at = NOW()
        WHERE id = v_user_id;

        UPDATE public.profiles
        SET status = 'active'
        WHERE id = v_user_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Email verified. You can now log in.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Keep old send_signup_otp as a no-op stub so handle_new_user trigger doesn't crash
-- (trigger calls it but frontend now handles email sending)
CREATE OR REPLACE FUNCTION public.send_signup_otp(p_email TEXT)
RETURNS JSONB AS $$
BEGIN
    -- No-op: OTP email is now sent by the frontend via Resend directly
    -- Just return success so the trigger doesn't fail
    RETURN jsonb_build_object('success', true, 'message', 'OTP handled by frontend.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.store_signup_otp(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_signup_otp(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_signup_otp(TEXT) TO anon, authenticated, service_role;
