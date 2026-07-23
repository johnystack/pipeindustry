-- Fix: Use timezone-safe timestamps and fix pg_net body type

CREATE OR REPLACE FUNCTION public.send_signup_otp(p_email TEXT)
RETURNS JSONB AS $$
DECLARE
    v_email   TEXT := LOWER(TRIM(p_email));
    v_code    TEXT := LPAD(floor(random() * 1000000)::TEXT, 6, '0');
    -- Use timezone-explicit UTC to avoid any server timezone mismatch
    v_expiry  TIMESTAMP WITH TIME ZONE := (NOW() AT TIME ZONE 'UTC') + INTERVAL '10 minutes';
    v_html    TEXT;
BEGIN
    -- Expire all previous unverified OTPs for this email
    UPDATE public.signup_otps
    SET expires_at = (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 second'
    WHERE LOWER(TRIM(email)) = v_email AND verified = FALSE;

    -- Store new OTP with explicit UTC expiry
    INSERT INTO public.signup_otps (email, code, expires_at, verified)
    VALUES (v_email, v_code, v_expiry, FALSE);

    -- Build email HTML
    v_html := '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;">'
           || '<div style="font-family:sans-serif;max-width:480px;margin:40px auto;padding:40px 32px;background:#1e293b;border-radius:20px;color:#fff;text-align:center;">'
           || '<h2 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#fff;">Verify Your Email</h2>'
           || '<p style="color:#94a3b8;font-size:14px;margin:0 0 32px;">Use this code to activate your TerrasInvestment account.</p>'
           || '<div style="background:#0f172a;border-radius:16px;padding:28px 16px;margin-bottom:28px;letter-spacing:14px;font-size:44px;font-weight:900;color:#059669;">'
           || v_code
           || '</div>'
           || '<p style="color:#64748b;font-size:13px;">Expires in <strong style="color:#f59e0b;">10 minutes</strong>.</p>'
           || '</div></body></html>';

    -- Send via Resend — body must be TEXT, not JSONB
    PERFORM net.http_post(
        url     := 'https://api.resend.com/emails',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || COALESCE(nullif(current_setting('app.settings.resend_api_key', true), ''), 're_YOUR_RESEND_API_KEY'),
            'Content-Type',  'application/json'
        ),
        body    := json_build_object(
            'from',    'TerrasInvestment <noreply@terrasinvestment.com>',
            'to',      ARRAY[v_email],
            'subject', 'Your Verification Code — TerrasInvestment',
            'html',    v_html
        )::TEXT
    );

    RETURN jsonb_build_object('success', true, 'message', 'Code sent.');
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'send_signup_otp failed for %: %', v_email, SQLERRM;
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Fix verify to also use explicit UTC comparison
CREATE OR REPLACE FUNCTION public.verify_signup_otp(p_email TEXT, p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_email   TEXT := LOWER(TRIM(p_email));
    v_code    TEXT := TRIM(p_code);
    v_otp_id  UUID;
    v_user_id UUID;
    v_latest  RECORD;
BEGIN
    -- Fetch latest OTP row for specific error messages
    SELECT * INTO v_latest
    FROM public.signup_otps
    WHERE LOWER(TRIM(email)) = v_email
    ORDER BY created_at DESC LIMIT 1;

    -- Try to find a valid matching OTP using UTC comparison
    SELECT id INTO v_otp_id
    FROM public.signup_otps
    WHERE LOWER(TRIM(email)) = v_email
      AND TRIM(code) = v_code
      AND expires_at > (NOW() AT TIME ZONE 'UTC')
      AND verified = FALSE
    ORDER BY created_at DESC LIMIT 1;

    -- Specific error messages
    IF v_otp_id IS NULL THEN
        IF v_latest.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'message', 'No code found. Please request a new one.');
        ELSIF v_latest.verified = TRUE THEN
            RETURN jsonb_build_object('success', false, 'message', 'Code already used. Please request a new one.');
        ELSIF v_latest.expires_at <= (NOW() AT TIME ZONE 'UTC') THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Code expired.',
                'debug_expired_at', v_latest.expires_at::TEXT,
                'debug_now_utc', (NOW() AT TIME ZONE 'UTC')::TEXT
            );
        ELSE
            RETURN jsonb_build_object('success', false, 'message', 'Incorrect code. Please check and try again.');
        END IF;
    END IF;

    -- Mark as used
    UPDATE public.signup_otps SET verified = TRUE WHERE id = v_otp_id;

    -- Find and activate user
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

GRANT EXECUTE ON FUNCTION public.send_signup_otp(TEXT)         TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_signup_otp(TEXT, TEXT) TO anon, authenticated, service_role;
