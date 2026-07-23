-- CLEANUP AND FIX FOR SIGNUP EMAIL ERRORS

-- 1. Remove old verification functions and triggers that conflict with SMTP
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.send_verification_email_pg_net(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.send_verification_email_pg_net;

-- 2. CREATE A ROBUST MASTER EMAIL DISPATCHER (Resend Direct)
CREATE OR REPLACE FUNCTION public.send_email_dispatch(p_email TEXT, p_type TEXT, p_payload JSONB)
RETURNS VOID AS $$
DECLARE
  v_resend_key TEXT := COALESCE(nullif(current_setting('app.settings.resend_api_key', true), ''), 're_YOUR_RESEND_API_KEY');
  v_subject TEXT;
  v_html TEXT;
BEGIN
  -- SETUP CONTENT
  IF p_type = 'welcome' THEN
    v_subject := 'Identity Provisioned - Welcome to TerrasInvestment';
    v_html := '<div style="font-family:sans-serif;padding:40px;border:1px solid #eee;border-radius:20px;text-align:center;">' ||
              '<h2 style="color:#059669;">Welcome, ' || COALESCE(p_payload->>'first_name', 'Chief') || '!</h2>' ||
              '<p>Your professional trading identity has been successfully created. You can now access the global hub and begin your trade cycles.</p>' ||
              '<br/><a href="https://terrasinvestment.com/login" style="background:#059669;color:white;padding:15px 30px;text-decoration:none;border-radius:10px;font-weight:bold;">Login to Dashboard</a></div>';
  ELSIF p_type = 'password_reset' THEN
    v_subject := 'Security Verification Code';
    v_html := '<div style="font-family:sans-serif;text-align:center;padding:40px;border:1px solid #eee;border-radius:20px;">' ||
              '<h2>Verification Code</h2><p>Use the code below to reset your access key:</p>' ||
              '<h1 style="letter-spacing:10px;color:#059669;font-size:48px;">' || (p_payload->>'code') || '</h1>' ||
              '<p>Expires in 10 minutes.</p></div>';
  END IF;

  -- SEND VIA RESEND (with error handling to prevent signup crash)
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

-- 3. UPDATED SIGNUP LOGIC (Handle Profile Creation Only)
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

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- VERY IMPORTANT: Catch errors so user is still created in auth.users
  RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. UPDATED WELCOME TRIGGER (On Profile Creation)
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Send the welcome email
    PERFORM public.send_email_dispatch(NEW.email, 'welcome', jsonb_build_object('first_name', NEW.first_name));
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Welcome email trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_welcome_email ON public.profiles;
CREATE TRIGGER on_user_created_welcome_email
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.trigger_welcome_email();
