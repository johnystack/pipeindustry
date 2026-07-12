-- Fix OTP expiry from 1 minute to 10 minutes so users have enough time to enter it
-- Also fix resend to properly invalidate old OTPs

CREATE OR REPLACE FUNCTION public.send_signup_otp(p_email TEXT)
RETURNS JSONB AS $$
DECLARE
    v_code TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate 6-digit OTP
    v_code := LPAD(floor(random() * 1000000)::text, 6, '0');
    -- Extended expiry: 10 minutes (was 1 minute which was too short)
    v_expires_at := NOW() + INTERVAL '10 minutes';

    -- Invalidate ALL previous unverified OTPs for this email
    UPDATE public.signup_otps 
    SET expires_at = NOW() - INTERVAL '1 second'
    WHERE LOWER(email) = LOWER(p_email) AND verified = FALSE;

    -- Store new OTP (always store lowercase email)
    INSERT INTO public.signup_otps (email, code, expires_at)
    VALUES (LOWER(p_email), v_code, v_expires_at);

    -- Dispatch email
    PERFORM public.send_email_dispatch(
        LOWER(p_email), 
        'signup_otp', 
        jsonb_build_object('code', v_code)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Verification code sent to your email.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also ensure verify_signup_otp is fully up to date
CREATE OR REPLACE FUNCTION public.verify_signup_otp(p_email TEXT, p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_otp_id UUID;
    v_user_id UUID;
BEGIN
    -- Find valid OTP (case-insensitive, not expired, not already verified)
    SELECT id INTO v_otp_id
    FROM public.signup_otps
    WHERE LOWER(email) = LOWER(p_email) 
      AND code = p_code 
      AND expires_at > NOW() 
      AND verified = FALSE
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_otp_id IS NULL THEN
        -- Give a descriptive error to help debug
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Invalid or expired verification code. Please request a new code.'
        );
    END IF;

    -- Mark OTP as verified
    UPDATE public.signup_otps SET verified = TRUE WHERE id = v_otp_id;

    -- Get user ID from profiles (case-insensitive match on email)
    SELECT id INTO v_user_id 
    FROM public.profiles 
    WHERE LOWER(email) = LOWER(p_email);

    IF v_user_id IS NOT NULL THEN
        -- Update auth.users to confirm the email
        UPDATE auth.users
        SET email_confirmed_at = NOW(),
            confirmed_at = NOW()
        WHERE id = v_user_id;

        -- Update profile status to active (was 'pending')
        UPDATE public.profiles
        SET status = 'active'
        WHERE id = v_user_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Identity verified and activated.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant permissions to be safe
GRANT EXECUTE ON FUNCTION public.send_signup_otp(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_signup_otp(TEXT, TEXT) TO anon, authenticated, service_role;
