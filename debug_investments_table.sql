-- Check what columns exist in the investments table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'investments'
ORDER BY ordinal_position;

-- Check if there are any investments at all
SELECT COUNT(*) as total_investments FROM investments;

-- Check sample data (if any exists)
SELECT * FROM investments LIMIT 5;