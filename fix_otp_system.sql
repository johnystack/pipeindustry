-- 1. CREATE SIGNUP OTPS TABLE
CREATE TABLE IF NOT EXISTS public.signup_otps (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT NOT NULL,
    code       TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified   BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_signup_otps_email ON public.signup_otps(LOWER(email));

-- Enable RLS & policies on signup_otps
ALTER TABLE public.signup_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon & auth access to signup_otps" ON public.signup_otps;
CREATE POLICY "Allow anon & auth access to signup_otps" ON public.signup_otps FOR ALL USING (true);

-- 2. STORE SIGNUP OTP FUNCTION
CREATE OR REPLACE FUNCTION public.store_signup_otp(p_email TEXT, p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_email TEXT := LOWER(TRIM(p_email));
    v_code  TEXT := TRIM(p_code);
BEGIN
    UPDATE public.signup_otps
    SET expires_at = NOW() - INTERVAL '1 second'
    WHERE LOWER(TRIM(email)) = v_email AND verified = FALSE;

    INSERT INTO public.signup_otps (email, code, expires_at, verified)
    VALUES (v_email, v_code, NOW() + INTERVAL '10 minutes', FALSE);

    RETURN jsonb_build_object('success', true, 'message', 'OTP stored');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. VERIFY SIGNUP OTP FUNCTION
CREATE OR REPLACE FUNCTION public.verify_signup_otp(p_email TEXT, p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_email   TEXT := LOWER(TRIM(p_email));
    v_code    TEXT := TRIM(p_code);
    v_otp_id  UUID;
    v_user_id UUID;
    v_latest  RECORD;
BEGIN
    SELECT * INTO v_latest
    FROM public.signup_otps
    WHERE LOWER(TRIM(email)) = v_email
    ORDER BY created_at DESC LIMIT 1;

    SELECT id INTO v_otp_id
    FROM public.signup_otps
    WHERE LOWER(TRIM(email)) = v_email
      AND TRIM(code) = v_code
      AND expires_at > NOW()
      AND verified = FALSE
    ORDER BY created_at DESC LIMIT 1;

    IF v_otp_id IS NULL THEN
        IF v_latest.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'message', 'No code found for this email.');
        ELSIF v_latest.verified = TRUE THEN
            RETURN jsonb_build_object('success', false, 'message', 'Code already used.');
        ELSIF v_latest.expires_at <= NOW() THEN
            RETURN jsonb_build_object('success', false, 'message', 'Code expired. Please request a new one.');
        ELSE
            RETURN jsonb_build_object('success', false, 'message', 'Incorrect code. Please check and try again.');
        END IF;
    END IF;

    UPDATE public.signup_otps SET verified = TRUE WHERE id = v_otp_id;

    SELECT id INTO v_user_id FROM public.profiles WHERE LOWER(TRIM(email)) = v_email;

    IF v_user_id IS NOT NULL THEN
        UPDATE auth.users
        SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            confirmed_at       = COALESCE(confirmed_at, NOW()),
            updated_at         = NOW()
        WHERE id = v_user_id;

        UPDATE public.profiles SET status = 'active' WHERE id = v_user_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Email verified successfully.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.store_signup_otp(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_signup_otp(TEXT, TEXT) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
