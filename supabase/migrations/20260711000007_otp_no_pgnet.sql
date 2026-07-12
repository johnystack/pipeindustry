-- OTP system that does NOT use pg_net at all.
-- Sending is handled by the Edge Function (send-verification-email).
-- DB only stores and verifies the OTP.

CREATE TABLE IF NOT EXISTS public.signup_otps (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT NOT NULL,
    code       TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified   BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_signup_otps_email ON public.signup_otps(LOWER(email));

-- verify_signup_otp: called by frontend after user enters the code
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
            RETURN jsonb_build_object('success', false, 'message', 'No code found. Please request a new one.');
        ELSIF v_latest.verified = TRUE THEN
            RETURN jsonb_build_object('success', false, 'message', 'Code already used. Please request a new one.');
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

    RETURN jsonb_build_object('success', true, 'message', 'Email verified. You can now log in.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- send_signup_otp stub: handle_new_user trigger calls this.
-- It's now a no-op — the Edge Function handles sending on signup.
CREATE OR REPLACE FUNCTION public.send_signup_otp(p_email TEXT)
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hardened handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email, role, status, username)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'trader'),
        'pending',
        NEW.raw_user_meta_data->>'username'
    )
    ON CONFLICT (id) DO NOTHING;

    IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
        UPDATE public.profiles
        SET referred_by = (
            SELECT id FROM public.profiles
            WHERE username = NEW.raw_user_meta_data->>'referral_code'
            LIMIT 1
        )
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT EXECUTE ON FUNCTION public.verify_signup_otp(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_signup_otp(TEXT)         TO anon, authenticated, service_role;
