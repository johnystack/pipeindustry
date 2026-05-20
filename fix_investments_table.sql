-- Comprehensive fix for investments table
-- Run this to ensure all necessary columns and relationships exist

-- First, let's see what we have
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'investments'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
ALTER TABLE investments 
ADD COLUMN IF NOT EXISTS payment_proof TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS plan_name TEXT,
ADD COLUMN IF NOT EXISTS expected_profit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_return NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Ensure plan_id exists and has proper foreign key
ALTER TABLE investments 
ADD COLUMN IF NOT EXISTS plan_id UUID;

-- Add foreign key constraint if it doesn't exist (this might fail if constraint already exists, that's ok)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'investments_plan_id_fkey' 
        AND table_name = 'investments'
    ) THEN
        ALTER TABLE investments 
        ADD CONSTRAINT investments_plan_id_fkey 
        FOREIGN KEY (plan_id) REFERENCES vendor_plans(id);
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
CREATE INDEX IF NOT EXISTS idx_investments_user_status ON investments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_investments_plan_id ON investments(plan_id);

-- Update any existing investments that might have missing data
UPDATE investments 
SET 
  duration = 24,
  due_date = created_at + INTERVAL '24 days'
WHERE duration IS NULL OR due_date IS NULL;

-- Show final table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'investments'
ORDER BY ordinal_position;