-- Add eligibility columns to vendor_plans
ALTER TABLE vendor_plans 
ADD COLUMN IF NOT EXISTS eligibility_status TEXT DEFAULT 'pending' CHECK (eligibility_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS eligibility_tx TEXT;

-- Update status logic: plans should only be 'active' if eligibility is 'approved'
-- We can add a trigger or handle this in the application logic.
