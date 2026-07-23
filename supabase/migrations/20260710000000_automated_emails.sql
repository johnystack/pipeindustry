-- Migration to support automated emails on welcome (email confirm), investment confirmation, and withdrawal confirmation.

-- 1. UPDATE MASTER EMAIL DISPATCHER WITH NEW TEMPLATES
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
              '<h2 style="color:#059669;">Welcome, ' || COALESCE(NULLIF(p_payload->>'username', ''), NULLIF(p_payload->>'first_name', ''), split_part(p_email, '@', 1), 'Trader') || '!</h2>' ||
              '<p>Your professional trading identity has been successfully verified. You can now access the global hub and begin your trade cycles.</p>' ||
              '<br/><a href="https://terrasinvestment.com/login" style="background:#059669;color:white;padding:15px 30px;text-decoration:none;border-radius:10px;font-weight:bold;">Login to Dashboard</a></div>';
  ELSIF p_type = 'password_reset' THEN
    v_subject := 'Security Verification Code';
    v_html := '<div style="font-family:sans-serif;text-align:center;padding:40px;border:1px solid #eee;border-radius:20px;max-width:600px;margin:0 auto;">' ||
              '<h2>Verification Code</h2><p>Use the code below to reset your access key:</p>' ||
              '<h1 style="letter-spacing:10px;color:#059669;font-size:48px;">' || (p_payload->>'code') || '</h1>' ||
              '<p>Expires in 10 minutes.</p></div>';
  ELSIF p_type = 'investment_confirmed' THEN
    v_subject := 'Investment Confirmed - TerrasInvestment';
    v_html := '<div style="font-family:sans-serif;padding:40px;border:1px solid #eee;border-radius:20px;color:#333;max-width:600px;margin:0 auto;">' ||
              '<div style="text-align:center;margin-bottom:20px;">' ||
              '<h2 style="color:#059669;margin-bottom:5px;">Investment Confirmed</h2>' ||
              '<p style="color:#666;font-size:14px;margin-top:0;">Your capital has successfully entered the market.</p>' ||
              '</div>' ||
              '<p>Hello ' || COALESCE(NULLIF(p_payload->>'username', ''), NULLIF(p_payload->>'first_name', ''), split_part(p_email, '@', 1), 'Trader') || ',</p>' ||
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
              '<p>Hello ' || COALESCE(NULLIF(p_payload->>'username', ''), NULLIF(p_payload->>'first_name', ''), split_part(p_email, '@', 1), 'Trader') || ',</p>' ||
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

-- 2. REMOVE THE OLD PROFILE INSERT WELCOME TRIGGER (so users don't get welcome email before confirmation)
DROP TRIGGER IF EXISTS on_user_created_welcome_email ON public.profiles;

-- 3. CREATE TRIGGER ON AUTH.USERS UPDATE FOR EMAIL CONFIRMATION (WELCOME EMAIL)
CREATE OR REPLACE FUNCTION public.handle_auth_user_confirmed()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
BEGIN
  -- Trigger only when email_confirmed_at becomes non-null (i.e. confirmed)
  IF (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL) THEN
    -- Fetch user's first name from profiles
    SELECT first_name INTO v_first_name
    FROM public.profiles
    WHERE id = NEW.id;

    -- Send the welcome email
    PERFORM public.send_email_dispatch(
      NEW.email,
      'welcome',
      jsonb_build_object('first_name', COALESCE(v_first_name, 'Chief'))
    );
    
    -- Sync status in profiles if not already done
    UPDATE public.profiles
    SET status = 'active'
    WHERE id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Welcome email on confirmation trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_confirmed();

-- 4. CREATE TRIGGER ON INVESTMENTS TABLE FOR ACTIVE (APPROVED) STATUS (INVESTMENT EMAIL)
CREATE OR REPLACE FUNCTION public.handle_investment_confirmation_email()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_first_name TEXT;
BEGIN
  -- Only trigger when status moves from pending/awaiting_proof to active
  IF (OLD.status = 'pending' OR OLD.status = 'awaiting_proof') AND NEW.status = 'active' THEN
    -- Fetch user's email and first name
    SELECT email, first_name INTO v_email, v_first_name
    FROM public.profiles
    WHERE id = NEW.user_id;

    IF v_email IS NOT NULL THEN
      PERFORM public.send_email_dispatch(
        v_email,
        'investment_confirmed',
        jsonb_build_object(
          'first_name', COALESCE(v_first_name, 'Chief'),
          'amount', NEW.amount,
          'plan_name', COALESCE(NEW.plan_name, 'Investment Plan')
        )
      );
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Investment confirmation email trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_investment_confirmed_email ON public.investments;
CREATE TRIGGER on_investment_confirmed_email
  AFTER UPDATE ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_investment_confirmation_email();

-- 5. CREATE TRIGGER ON TRANSACTIONS TABLE FOR APPROVED WITHDRAWAL (WITHDRAWAL EMAIL)
CREATE OR REPLACE FUNCTION public.handle_withdrawal_approved_email()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_first_name TEXT;
BEGIN
  -- Only trigger when type is withdrawal and status moves to approved
  IF NEW.type = 'withdrawal' AND OLD.status = 'pending' AND NEW.status = 'approved' THEN
    -- Fetch user email and first name
    SELECT email, first_name INTO v_email, v_first_name
    FROM public.profiles
    WHERE id = NEW.user_id;

    IF v_email IS NOT NULL THEN
      PERFORM public.send_email_dispatch(
        v_email,
        'withdrawal_approved',
        jsonb_build_object(
          'first_name', COALESCE(v_first_name, 'Chief'),
          'amount', NEW.amount,
          'fee', COALESCE(NEW.fee, 0),
          'crypto', COALESCE(NEW.crypto, 'NGN'),
          'address', COALESCE(NEW.address, '')
        )
      );
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Withdrawal approved email trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_withdrawal_approved_email ON public.transactions;
CREATE TRIGGER on_withdrawal_approved_email
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_withdrawal_approved_email();
