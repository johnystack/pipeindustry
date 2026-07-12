-- ================================================================
-- REMOVE ALL DUPLICATE OTP SENDERS & FIX confirmed_at ERROR
-- ================================================================

-- 1. Drop ALL old email-sending triggers that cause duplicate emails
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP TRIGGER IF EXISTS on_user_created_welcome_email ON public.profiles;
DROP TRIGGER IF EXISTS on_investment_confirmed_email ON public.investments;
DROP TRIGGER IF EXISTS on_withdrawal_approved_email ON public.transactions;

-- 2. Clean handle_new_user — ONLY creates profile row, nothing else
--    Email sending is 100% handled by the Edge Function
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

    -- Handle referral
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

-- Re-attach cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Fix verify_signup_otp — remove confirmed_at (Supabase manages it internally)
CREATE OR REPLACE FUNCTION public.verify_signup_otp(p_email TEXT, p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_email   TEXT := LOWER(TRIM(p_email));
    v_code    TEXT := TRIM(p_code);
    v_otp_id  UUID;
    v_user_id UUID;
    v_latest  RECORD;
BEGIN
    -- Get latest OTP for this email (for error messages)
    SELECT * INTO v_latest
    FROM public.signup_otps
    WHERE LOWER(TRIM(email)) = v_email
    ORDER BY created_at DESC LIMIT 1;

    -- Find a valid matching OTP
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

    -- Mark OTP as used
    UPDATE public.signup_otps SET verified = TRUE WHERE id = v_otp_id;

    -- Find user
    SELECT id INTO v_user_id FROM public.profiles WHERE LOWER(TRIM(email)) = v_email;

    IF v_user_id IS NOT NULL THEN
        -- Only set email_confirmed_at — DO NOT touch confirmed_at (Supabase internal)
        UPDATE auth.users
        SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW()
        WHERE id = v_user_id
          AND email_confirmed_at IS NULL;

        -- Activate profile
        UPDATE public.profiles SET status = 'active' WHERE id = v_user_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Email verified. You can now log in.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. send_signup_otp is now a pure no-op stub (Edge Function handles sending)
CREATE OR REPLACE FUNCTION public.send_signup_otp(p_email TEXT)
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Permissions
GRANT EXECUTE ON FUNCTION public.verify_signup_otp(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_signup_otp(TEXT)         TO anon, authenticated, service_role;
