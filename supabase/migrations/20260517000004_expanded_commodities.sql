-- Update vendor_plans asset_type check constraint
ALTER TABLE vendor_plans DROP CONSTRAINT IF EXISTS vendor_plans_asset_type_check;

ALTER TABLE vendor_plans 
ADD CONSTRAINT vendor_plans_asset_type_check 
CHECK (asset_type IN (
    'Gold', 'Lithium', 'Crude Oil', 'Nickel', 'Silver', 
    'Bitcoin', 'Natural Gas', 'Copper', 'Platinum', 
    'Palladium', 'Iron Ore', 'Aluminum', 'Wheat', 
    'Corn', 'Soybeans'
));

-- Add fixed_limit column to vendor_plans if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_plans' AND column_name = 'fixed_limit') THEN
        ALTER TABLE vendor_plans ADD COLUMN fixed_limit NUMERIC;
    END IF;
END $$;
