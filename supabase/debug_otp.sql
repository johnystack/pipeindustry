-- Run these one by one in Supabase SQL Editor to find the exact problem

-- 1. Check what timezone the database is using
SHOW timezone;

-- 2. Check the last 5 OTP records with timezone-aware times
SELECT 
  email,
  code,
  created_at,
  expires_at,
  verified,
  NOW() as db_now,
  expires_at - NOW() as time_remaining,
  expires_at > NOW() as is_valid
FROM public.signup_otps
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check if pg_net is enabled
SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_net';
