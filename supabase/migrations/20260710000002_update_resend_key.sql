-- Migration to update Resend API Key in send_email_dispatch to match the active one in .env

CREATE OR REPLACE FUNCTION public.send_email_dispatch(p_email TEXT, p_type TEXT, p_payload JSONB)
RETURNS VOID AS $$
DECLARE
  v_resend_key TEXT := 're_YGiQ6jYV_7vdyWCYUJcRY1AQ6zpEgUBvg'; -- Updated with active API Key from .env
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
