-- 1. Standardize Investment Duration in Background Functions
CREATE OR REPLACE FUNCTION public.update_due_investments()
RETURNS void AS $$
BEGIN
  UPDATE public.investments
  SET status = 'completed'
  WHERE status = 'active'
  AND approved_at <= NOW() - INTERVAL '24 days';
END;
$$ LANGUAGE plpgsql;

-- 2. Update Vendor Plans Asset Types Check Constraint
ALTER TABLE vendor_plans DROP CONSTRAINT IF EXISTS vendor_plans_asset_type_check;

ALTER TABLE vendor_plans 
ADD CONSTRAINT vendor_plans_asset_type_check 
CHECK (asset_type IN (
    'Gold', 'Lithium', 'Crude Oil', 'Nickel', 'Silver', 
    'Bitcoin', 'Natural Gas', 'Copper', 'Platinum', 
    'Palladium', 'Iron Ore', 'Aluminum'
));

-- 3. Cleanup: Ensure all pending plans default to the correct duration and ROI
UPDATE vendor_plans
SET duration_days = 24,
    daily_return_percent = (50.0 / 24.0)
WHERE eligibility_status = 'pending';

-- 4. Update existing profiles to ensure 'role' exists and is standardized
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'trader';
    END IF;
END $$;

-- 5. Helper to make a user an Admin (Usage: UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com')
-- Just ensuring the constraint exists for roles if we want it, but usually TEXT is enough.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('trader', 'vendor', 'admin'));
