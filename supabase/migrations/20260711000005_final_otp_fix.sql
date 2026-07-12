-- =================================================================
-- FINAL DEFINITIVE OTP FIX
-- OTP is sent from DB via pg_net + Resend (no CORS issues)
-- Triggered automatically on signup via handle_new_user trigger
-- Frontend only: verifies the code + calls resend RPC if needed
-- =================================================================

-- Step 1: Ensure the table exists cleanly
CREATE TABLE IF NOT EXISTS public.signup_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_signup_otps_email ON public.signup_otps(LOWER(email));

-- Step 2: THE ONE send_signup_otp function — sends email + stores OTP
-- Uses the active Resend API key
CREATE OR REPLACE FUNCTION public.send_signup_otp(p_email TEXT)
RETURNS JSONB AS $$
DECLARE
    v_email   TEXT := LOWER(TRIM(p_email));
    v_code    TEXT := LPAD(floor(random() * 1000000)::TEXT, 6, '0');
    v_expiry  TIMESTAMP WITH TIME ZONE := NOW() + INTERVAL '10 minutes';
    v_html    TEXT;
BEGIN
    -- Expire all previous unverified OTPs for this email
    UPDATE public.signup_otps
    SET expires_at = NOW() - INTERVAL '1 second'
    WHERE LOWER(TRIM(email)) = v_email AND verified = FALSE;

    -- Store new OTP
    INSERT INTO public.signup_otps (email, code, expires_at, verified)
    VALUES (v_email, v_code, v_expiry, FALSE);

    -- Build email HTML
    v_html := '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;">'
           || '<div style="font-family:sans-serif;max-width:480px;margin:40px auto;padding:40px 32px;background:#1e293b;border-radius:20px;color:#fff;text-align:center;">'
           || '<div style="width:64px;height:64px;background:#059669;border-radius:50%;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;font-size:32px;">&#10003;</div>'
           || '<h2 style="margin:0 0 8px;font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#fff;">Verify Your Email</h2>'
           || '<p style="color:#94a3b8;font-size:14px;margin:0 0 32px;line-height:1.6;">Use the code below to activate your TerrasInvestment account. Do not share this code.</p>'
           || '<div style="background:#0f172a;border-radius:16px;padding:28px 16px;margin-bottom:28px;letter-spacing:14px;font-size:44px;font-weight:900;color:#059669;border:1px solid #1e3a2f;">'
           || v_code
           || '</div>'
           || '<p style="color:#64748b;font-size:13px;margin:0;line-height:1.6;">This code expires in <strong style="color:#f59e0b;">10 minutes</strong>.<br/>If you did not register, ignore this email.</p>'
           || '</div></body></html>';

    -- Send via Resend through pg_net (non-blocking)
    PERFORM net.http_post(
        url     := 'https://api.resend.com/emails',
        headers := jsonb_build_object(
            'Authorization', 'Bearer re_YGiQ6jYV_7vdyWCYUJcRY1AQ6zpEgUBvg',
            'Content-Type',  'application/json'
        ),
        body    := json_build_object(
            'from',    'TerrasInvestment <noreply@terrasinvestment.com>',
            'to',      ARRAY[v_email],
            'subject', 'Your Verification Code — TerrasInvestment',
            'html',    v_html
        )::text
    );

    RETURN jsonb_build_object('success', true, 'message', 'Verification code sent.');
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'send_signup_otp failed for %: %', v_email, SQLERRM;
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: verify_signup_otp — verifies code and activates account
CREATE OR REPLACE FUNCTION public.verify_signup_otp(p_email TEXT, p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_email   TEXT := LOWER(TRIM(p_email));
    v_code    TEXT := TRIM(p_code);
    v_otp_id  UUID;
    v_user_id UUID;
    v_latest  RECORD;
BEGIN
    -- Get the latest OTP row for specific error messages
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
            RETURN jsonb_build_object('success', false, 'message', 'Code has expired. Please request a new one.');
        ELSE
            RETURN jsonb_build_object('success', false, 'message', 'Incorrect code. Please check and try again.');
        END IF;
    END IF;

    -- Mark as used
    UPDATE public.signup_otps SET verified = TRUE WHERE id = v_otp_id;

    -- Find user and activate
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

-- Step 4: Harden handle_new_user — upsert profile + send OTP on signup
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

    -- Send OTP — wrapped so failure never blocks user creation
    BEGIN
        PERFORM public.send_signup_otp(NEW.email);
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'OTP send failed for %: %', NEW.email, SQLERRM;
    END;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Permissions
GRANT EXECUTE ON FUNCTION public.send_signup_otp(TEXT)         TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_signup_otp(TEXT, TEXT) TO anon, authenticated, service_role;

-- Step 6: Verify pg_net is active (email sending requires this)
SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_net';
-- If empty result: go to Supabase Dashboard → Database → Extensions → enable pg_net
