-- Test query to check current investments table structure and data
SELECT 
  i.*,
  p.first_name,
  p.last_name,
  p.email,
  vp.name as plan_name,
  vp.asset_type
FROM investments i
LEFT JOIN profiles p ON i.user_id = p.id
LEFT JOIN vendor_plans vp ON i.plan_id = vp.id
ORDER BY i.created_at DESC
LIMIT 10;

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'investments'
ORDER BY ordinal_position;