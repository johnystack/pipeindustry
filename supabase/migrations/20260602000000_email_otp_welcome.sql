-- Email and OTP Support Migration
-- 1. Create table for password reset OTPs
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON public.password_reset_otps(email);

-- 2. Generic email sender function (to be called by other functions)
CREATE OR REPLACE FUNCTION public.send_email_dispatch(
  p_email TEXT,
  p_type TEXT,
  p_payload JSONB
)
RETURNS VOID AS $$
BEGIN
  -- IMPORTANT: Replace [PROJECT_REF] with your actual Supabase project reference
  -- And ensure your Edge Function is named 'send-verification-email' or rename it to 'send-email'
  PERFORM net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/send-verification-email', 
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM public.settings WHERE id = 1) -- You can store service_role here or use a better secret management
    ),
    body := json_build_object(
      'email', p_email,
      'type', p_type,
      'payload', p_payload
    )::jsonb
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Function to request password reset OTP
CREATE OR REPLACE FUNCTION public.request_password_reset_otp(p_email TEXT)
RETURNS JSONB AS $$
DECLARE
    v_code TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_user_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE email = p_email) INTO v_user_exists;

    IF NOT v_user_exists THEN
        RETURN jsonb_build_object('success', false, 'message', 'Account not found.');
    END IF;

    -- Generate 6-digit OTP
    v_code := LPAD(floor(random() * 1000000)::text, 6, '0');
    v_expires_at := NOW() + INTERVAL '10 minutes';

    -- Invalidate old unverified OTPs for this email
    UPDATE public.password_reset_otps SET expires_at = NOW() WHERE email = p_email AND verified = FALSE;

    -- Store new OTP
    INSERT INTO public.password_reset_otps (email, code, expires_at)
    VALUES (p_email, v_code, v_expires_at);

    -- Dispatch email
    PERFORM public.send_email_dispatch(
        p_email, 
        'password_reset', 
        jsonb_build_object('code', v_code)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Code sent to your email.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to verify OTP
CREATE OR REPLACE FUNCTION public.verify_password_reset_otp(p_email TEXT, p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_otp_id UUID;
BEGIN
    SELECT id INTO v_otp_id
    FROM public.password_reset_otps
    WHERE email = p_email AND code = p_code AND expires_at > NOW() AND verified = FALSE
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_otp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid or expired code.');
    END IF;

    -- Mark as verified
    UPDATE public.password_reset_otps SET verified = TRUE WHERE id = v_otp_id;

    RETURN jsonb_build_object('success', true, 'message', 'Identity verified.', 'otp_id', v_otp_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to reset password using verified OTP
-- This uses SECURITY DEFINER to update auth.users
CREATE OR REPLACE FUNCTION public.reset_password_with_otp(
    p_email TEXT,
    p_otp_id UUID,
    p_new_password TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_verified BOOLEAN;
    v_user_id UUID;
BEGIN
    -- Verify the OTP was actually verified by our verify function
    SELECT verified INTO v_verified
    FROM public.password_reset_otps
    WHERE id = p_otp_id AND email = p_email AND created_at > NOW() - INTERVAL '15 minutes';

    IF v_verified IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized. Verification expired or invalid.');
    END IF;

    -- Get user ID from profiles
    SELECT id INTO v_user_id FROM public.profiles WHERE email = p_email;

    -- Update password in auth.users
    -- This requires the 'pg_auth_mon' or similar extensions sometimes, but usually 
    -- SECURITY DEFINER on a function owned by postgres works for updating auth schema if allowed.
    -- Alternatively, use the internal crypt function.
    UPDATE auth.users 
    SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf'))
    WHERE id = v_user_id;

    -- Delete the OTP so it can't be used again
    DELETE FROM public.password_reset_otps WHERE id = p_otp_id;

    RETURN jsonb_build_object('success', true, 'message', 'Security key updated successfully.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger for Welcome Email
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.send_email_dispatch(
        NEW.email, 
        'welcome', 
        jsonb_build_object('first_name', NEW.first_name)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_welcome_email ON public.profiles;
CREATE TRIGGER on_user_created_welcome_email
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.trigger_welcome_email();
