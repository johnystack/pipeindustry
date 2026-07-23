-- Migration to support custom signup OTP verification with 1 minute expiry.

-- 1. Create table for signup OTPs
CREATE TABLE IF NOT EXISTS public.signup_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_signup_otps_email ON public.signup_otps(email);

-- 2. UPDATE MASTER EMAIL DISPATCHER WITH SIGNUP OTP TEMPLATE
CREATE OR REPLACE FUNCTION public.send_email_dispatch(p_email TEXT, p_type TEXT, p_payload JSONB)
RETURNS VOID AS $$
DECLARE
  v_resend_key TEXT := COALESCE(nullif(current_setting('app.settings.resend_api_key', true), ''), 're_YOUR_RESEND_API_KEY');
  v_subject TEXT;
  v_html TEXT;
  v_amount_text TEXT;
BEGIN
  -- Format amount if present in payload
  IF p_payload->>'amount' IS NOT NULL THEN
    v_amount_text := p_payload->>'amount';
    -- Simple format if it is a pure numeric string
    IF v_amount_text ~ '^[0-9.]+$' THEN
      v_amount_text := '$' || to_char(v_amount_text::numeric, 'FM999,999,999.00');
    END IF;
  END IF;

  -- SETUP CONTENT
  IF p_type = 'welcome' THEN
    v_subject := 'Identity Provisioned - Welcome to TerrasInvestment';
    v_html := '<div style="font-family:sans-serif;padding:40px;border:1px solid #eee;border-radius:20px;text-align:center;max-width:600px;margin:0 auto;">' ||
              '<h2 style="color:#059669;">Welcome, ' || COALESCE(p_payload->>'first_name', 'Chief') || '!</h2>' ||
              '<p>Your professional trading identity has been successfully verified. You can now access the global hub and begin your trade cycles.</p>' ||
              '<br/><a href="https://terrasinvestment.com/login" style="background:#059669;color:white;padding:15px 30px;text-decoration:none;border-radius:10px;font-weight:bold;">Login to Dashboard</a></div>';
  ELSIF p_type = 'password_reset' THEN
    v_subject := 'Security Verification Code';
    v_html := '<div style="font-family:sans-serif;text-align:center;padding:40px;border:1px solid #eee;border-radius:20px;max-width:600px;margin:0 auto;">' ||
              '<h2>Verification Code</h2><p>Use the code below to reset your access key:</p>' ||
              '<h1 style="letter-spacing:10px;color:#059669;font-size:48px;">' || (p_payload->>'code') || '</h1>' ||
              '<p>Expires in 10 minutes.</p></div>';
  ELSIF p_type = 'signup_otp' THEN
    v_subject := 'Email Verification Code';
    v_html := '<div style="font-family:sans-serif;text-align:center;padding:40px;border:1px solid #eee;border-radius:20px;max-width:600px;margin:0 auto;">' ||
              '<h2>Email Verification Code</h2><p>Use the 6-digit code below to verify your email and activate your account:</p>' ||
              '<h1 style="letter-spacing:10px;color:#059669;font-size:48px;">' || (p_payload->>'code') || '</h1>' ||
              '<p style="color:#ef4444;font-weight:bold;">Warning: This code will expire in 1 minute.</p></div>';
  ELSIF p_type = 'investment_confirmed' THEN
    v_subject := 'Investment Confirmed - TerrasInvestment';
    v_html := '<div style="font-family:sans-serif;padding:40px;border:1px solid #eee;border-radius:20px;color:#333;max-width:600px;margin:0 auto;">' ||
              '<div style="text-align:center;margin-bottom:20px;">' ||
              '<h2 style="color:#059669;margin-bottom:5px;">Investment Confirmed</h2>' ||
              '<p style="color:#666;font-size:14px;margin-top:0;">Your capital has successfully entered the market.</p>' ||
              '</div>' ||
              '<p>Hello ' || COALESCE(p_payload->>'first_name', 'Chief') || ',</p>' ||
              '<p>This email confirms that your investment of <strong>' || COALESCE(v_amount_text, p_payload->>'amount', '0') || '</strong> in the <strong>' || COALESCE(p_payload->>'plan_name', 'Investment Plan') || '</strong> has been approved by our administrators and is now actively generating returns.</p>' ||
              '<div style="background:#f9f9f9;border:1px solid #eee;border-radius:10px;padding:20px;margin:20px 0;">' ||
              '<table style="width:100%;font-size:14px;border-collapse:collapse;">' ||
              '<tr><td style="padding:5px 0;color:#666;">Asset Plan:</td><td style="padding:5px 0;text-align:right;font-weight:bold;">' || COALESCE(p_payload->>'plan_name', 'N/A') || '</td></tr>' ||
              '<tr><td style="padding:5px 0;color:#666;">Deposit Capital:</td><td style="padding:5px 0;text-align:right;font-weight:bold;">' || COALESCE(v_amount_text, p_payload->>'amount', '0') || '</td></tr>' ||
              '<tr><td style="padding:5px 0;color:#666;">Status:</td><td style="padding:5px 0;text-align:right;color:#059669;font-weight:bold;">ACTIVE</td></tr>' ||
              '</table>' ||
              '</div>' ||
              '<div style="text-align:center;margin-top:30px;">' ||
              '<a href="https://terrasinvestment.com/login" style="background:#059669;color:white;padding:15px 30px;text-decoration:none;border-radius:10px;font-weight:bold;display:inline-block;">View Portfolio</a>' ||
              '</div>' ||
              '</div>';
  ELSIF p_type = 'withdrawal_approved' THEN
    v_subject := 'Withdrawal Dispatched - TerrasInvestment';
    v_html := '<div style="font-family:sans-serif;padding:40px;border:1px solid #eee;border-radius:20px;color:#333;max-width:600px;margin:0 auto;">' ||
              '<div style="text-align:center;margin-bottom:20px;">' ||
              '<h2 style="color:#d97706;margin-bottom:5px;">Withdrawal Approved</h2>' ||
              '<p style="color:#666;font-size:14px;margin-top:0;">Your withdrawal request has been processed successfully.</p>' ||
              '</div>' ||
              '<p>Hello ' || COALESCE(p_payload->>'first_name', 'Chief') || ',</p>' ||
              '<p>We are writing to confirm that your withdrawal of <strong>' || COALESCE(p_payload->>'amount', '0') || ' ' || COALESCE(p_payload->>'crypto', '') || '</strong> has been fully processed and dispatched to your authorized destination address.</p>' ||
              '<div style="background:#f9f9f9;border:1px solid #eee;border-radius:10px;padding:20px;margin:20px 0;">' ||
              '<table style="width:100%;font-size:14px;border-collapse:collapse;">' ||
              '<tr><td style="padding:5px 0;color:#666;">Dispatched Amount:</td><td style="padding:5px 0;text-align:right;font-weight:bold;">' || COALESCE(p_payload->>'amount', '0') || ' ' || COALESCE(p_payload->>'crypto', '') || '</td></tr>' ||
              '<tr><td style="padding:5px 0;color:#666;">Processing Fee:</td><td style="padding:5px 0;text-align:right;font-weight:bold;">' || COALESCE(p_payload->>'fee', '0') || ' ' || COALESCE(p_payload->>'crypto', '') || '</td></tr>' ||
              '<tr><td style="padding:5px 0;color:#666;">Destination:</td><td style="padding:5px 0;text-align:right;font-family:monospace;font-size:12px;word-break:break-all;">' || COALESCE(p_payload->>'address', 'N/A') || '</td></tr>' ||
              '<tr><td style="padding:5px 0;color:#666;">Status:</td><td style="padding:5px 0;text-align:right;color:#d97706;font-weight:bold;">COMPLETED</td></tr>' ||
              '</table>' ||
              '</div>' ||
              '<div style="text-align:center;margin-top:30px;">' ||
              '<a href="https://terrasinvestment.com/login" style="background:#d97706;color:white;padding:15px 30px;text-decoration:none;border-radius:10px;font-weight:bold;display:inline-block;">Access Account</a>' ||
              '</div>' ||
              '</div>';
  END IF;

  -- SEND VIA RESEND
  BEGIN
    PERFORM net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object('Authorization', 'Bearer ' || v_resend_key, 'Content-Type', 'application/json'),
      body := json_build_object(
        'from', 'TerrasInvestment <noreply@terrasinvestment.com>',
        'to', ARRAY[p_email],
        'subject', v_subject,
        'html', v_html
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'External email dispatch failed: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to request/send signup OTP
CREATE OR REPLACE FUNCTION public.send_signup_otp(p_email TEXT)
RETURNS JSONB AS $$
DECLARE
    v_code TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate 6-digit OTP
    v_code := LPAD(floor(random() * 1000000)::text, 6, '0');
    -- Set expiry to exactly 1 minute (60 seconds)
    v_expires_at := NOW() + INTERVAL '1 minute';

    -- Invalidate old unverified OTPs for this email
    UPDATE public.signup_otps SET expires_at = NOW() WHERE email = p_email AND verified = FALSE;

    -- Store new OTP
    INSERT INTO public.signup_otps (email, code, expires_at)
    VALUES (p_email, v_code, v_expires_at);

    -- Dispatch email
    PERFORM public.send_email_dispatch(
        p_email, 
        'signup_otp', 
        jsonb_build_object('code', v_code)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Verification code sent to your email.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to verify signup OTP and active user
CREATE OR REPLACE FUNCTION public.verify_signup_otp(p_email TEXT, p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_otp_id UUID;
    v_user_id UUID;
BEGIN
    -- Find the valid OTP (expires in 1 minute)
    SELECT id INTO v_otp_id
    FROM public.signup_otps
    WHERE email = p_email AND code = p_code AND expires_at > NOW() AND verified = FALSE
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_otp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid or expired verification code.');
    END IF;

    -- Mark OTP as verified
    UPDATE public.signup_otps SET verified = TRUE WHERE id = v_otp_id;

    -- Get user ID from profiles
    SELECT id INTO v_user_id FROM public.profiles WHERE email = p_email;

    IF v_user_id IS NOT NULL THEN
        -- Update auth.users to confirm the email
        UPDATE auth.users
        SET email_confirmed_at = NOW(),
            confirmed_at = NOW()
        WHERE id = v_user_id;

        -- Update profile status to active
        UPDATE public.profiles
        SET status = 'active'
        WHERE id = v_user_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Identity verified and activated.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Updated handle_new_user function to automatically send OTP on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, first_name, last_name, email, role, status, username)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name', 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'trader'), 
    'pending', 
    new.raw_user_meta_data->>'username'
  );

  -- Handle Referral if exists
  IF new.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    UPDATE public.profiles
    SET referred_by = (SELECT id FROM public.profiles WHERE username = new.raw_user_meta_data->>'referral_code')
    WHERE id = new.id;
  END IF;

  -- Generate and send signup OTP
  PERFORM public.send_signup_otp(new.email);

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Catch errors so user is still created in auth.users
  RAISE WARNING 'Profile creation or OTP dispatch failed for user %: %', new.id, SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
