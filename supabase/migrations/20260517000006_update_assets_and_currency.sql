-- Update vendor_plans asset_type check constraint (remove Wheat, keep others)
ALTER TABLE vendor_plans DROP CONSTRAINT IF EXISTS vendor_plans_asset_type_check;

ALTER TABLE vendor_plans 
ADD CONSTRAINT vendor_plans_asset_type_check 
CHECK (asset_type IN (
    'Gold', 'Lithium', 'Crude Oil', 'Nickel', 'Silver', 
    'Bitcoin', 'Natural Gas', 'Copper', 'Platinum', 
    'Palladium', 'Iron Ore', 'Aluminum', 
    'Corn', 'Soybeans'
));
