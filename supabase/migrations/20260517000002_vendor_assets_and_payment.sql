-- Add asset_type and payment_details to vendor_plans
ALTER TABLE vendor_plans 
ADD COLUMN asset_type TEXT CHECK (asset_type IN ('Gold', 'Lithium', 'Crude', 'Nickel', 'Silver')),
ADD COLUMN payment_details TEXT;

-- Update the status check to include more descriptive statuses if needed
-- (existing status is active/inactive, which is fine)

-- Function to upgrade user to vendor
CREATE OR REPLACE FUNCTION upgrade_to_vendor(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET role = 'vendor'
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
