-- Simple test queries for investments table

-- 1. Check if table exists and basic structure
SELECT COUNT(*) as total_investments FROM investments;

-- 2. Check what statuses exist
SELECT status, COUNT(*) as count 
FROM investments 
GROUP BY status;

-- 3. Simple select to see what data we have
SELECT 
  id,
  user_id,
  plan_id,
  amount,
  status,
  created_at,
  payment_proof
FROM investments 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check if we have any relationships working
SELECT 
  i.id,
  i.amount,
  i.status,
  p.email as user_email,
  vp.name as plan_name
FROM investments i
LEFT JOIN profiles p ON i.user_id = p.id  
LEFT JOIN vendor_plans vp ON i.plan_id = vp.id
LIMIT 5;