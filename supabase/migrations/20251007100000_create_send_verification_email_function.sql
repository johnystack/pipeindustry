CREATE OR REPLACE FUNCTION send_verification_email_pg_net(email TEXT, token TEXT)
RETURNS void AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://pipindustry.org/api/send-verification-email',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object(
      'email', email,
      'token', token
    )::jsonb
  );
END;
$$ LANGUAGE plpgsql;
