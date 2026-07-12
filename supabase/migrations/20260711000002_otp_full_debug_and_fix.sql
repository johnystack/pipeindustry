-- ============================================================
-- FULL OTP DEBUG & FIX
-- Run each section one at a time in Supabase SQL Editor
-- ============================================================

-- STEP 1: Check if pg_net extension is enabled (required for sending emails)
SELECT * FROM pg_extension WHERE extname = 'pg_net';
-- If this returns empty, pg_net is NOT enabled. See Supabase dashboard steps below.

-- STEP 2: Check if the signup_otps table exists
SELECT COUNT(*) as otp_count FROM public.signup_otps;

-- STEP 3: See the last 10 OTP records to understand what's being stored
SELECT email, code, expires_at, verified, created_at
FROM public.signup_otps
ORDER BY created_at DESC
LIMIT 10;

-- STEP 4: Check current time vs expiry (helps confirm timezone issues)
SELECT 
  NOW() as current_time,
  email,
  code,
  expires_at,
  expires_at > NOW() as is_valid,
  verified
FROM public.signup_otps
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================
-- ACTUAL FIX: Extend OTP to 30 minutes + fix all edge cases
-- ============================================================

CREATE OR REPLACE FUNCTION public.send_signup_otp(p_email TEXT)
RETURNS JSONB AS $$
DECLARE
    v_code TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_email TEXT := LOWER(TRIM(p_email));
BEGIN
    -- Generate 6-digit OTP (zero-padded)
    v_code := LPAD(floor(random() * 1000000)::TEXT, 6, '0');
    
    -- 30 minutes expiry — plenty of time
    v_expires_at := NOW() + INTERVAL '30 minutes';

    -- Expire all previous unverified OTPs for this email
    UPDATE public.signup_otps 
    SET expires_at = NOW() - INTERVAL '1 second'
    WHERE LOWER(TRIM(email)) = v_email AND verified = FALSE;

    -- Insert new OTP
    INSERT INTO public.signup_otps (email, code, expires_at, verified)
    VALUES (v_email, v_code, v_expires_at, FALSE);

    -- Send email via Resend through pg_net
    PERFORM public.send_email_dispatch(
        v_email,
        'signup_otp',
        jsonb_build_object('code', v_code)
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Verification code sent. Valid for 30 minutes.',
        'debug_expires_at', v_expires_at::TEXT  -- remove this line in production
    );
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'send_signup_otp failed for %: %', v_email, SQLERRM;
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Failed to send OTP: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix verify function with better error messaging
CREATE OR REPLACE FUNCTION public.verify_signup_otp(p_email TEXT, p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_otp_id UUID;
    v_user_id UUID;
    v_email TEXT := LOWER(TRIM(p_email));
    v_code TEXT := TRIM(p_code);
    v_otp RECORD;
BEGIN
    -- First find ANY OTP for this email (for debug info)
    SELECT * INTO v_otp
    FROM public.signup_otps
    WHERE LOWER(TRIM(email)) = v_email
    ORDER BY created_at DESC
    LIMIT 1;

    -- Now find a valid one
    SELECT id INTO v_otp_id
    FROM public.signup_otps
    WHERE LOWER(TRIM(email)) = v_email
      AND TRIM(code) = v_code
      AND expires_at > NOW()
      AND verified = FALSE
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_otp_id IS NULL THEN
        -- Give specific reason to help debug
        IF v_otp.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'message', 'No OTP found for this email. Please request a new code.');
        ELSIF v_otp.verified = TRUE THEN
            RETURN jsonb_build_object('success', false, 'message', 'This code has already been used. Please request a new code.');
        ELSIF v_otp.expires_at <= NOW() THEN
            RETURN jsonb_build_object('success', false, 'message', 'Code has expired. Please request a new code.');
        ELSIF TRIM(v_otp.code) != v_code THEN
            RETURN jsonb_build_object('success', false, 'message', 'Incorrect code. Please check and try again.');
        ELSE
            RETURN jsonb_build_object('success', false, 'message', 'Invalid verification code.');
        END IF;
    END IF;

    -- Mark OTP as verified
    UPDATE public.signup_otps SET verified = TRUE WHERE id = v_otp_id;

    -- Get user ID from profiles
    SELECT id INTO v_user_id
    FROM public.profiles
    WHERE LOWER(TRIM(email)) = v_email;

    IF v_user_id IS NOT NULL THEN
        -- Confirm the email in auth.users
        UPDATE auth.users
        SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            confirmed_at = COALESCE(confirmed_at, NOW()),
            updated_at = NOW()
        WHERE id = v_user_id;

        -- Set profile status to active
        UPDATE public.profiles
        SET status = 'active'
        WHERE id = v_user_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Email verified successfully. You can now log in.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Verification error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION public.send_signup_otp(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_signup_otp(TEXT, TEXT) TO anon, authenticated, service_role;

-- Confirm grants were applied
SELECT routine_name, grantee, privilege_type
FROM information_schema.role_routine_grants
WHERE routine_name IN ('send_signup_otp', 'verify_signup_otp');
