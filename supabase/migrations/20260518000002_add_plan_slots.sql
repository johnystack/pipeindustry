-- Add slots and selected wallet to vendor_plans table
ALTER TABLE vendor_plans 
ADD COLUMN IF NOT EXISTS max_traders INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS current_traders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS selected_wallet_id UUID REFERENCES vendor_payment_wallets(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_plans_wallet ON vendor_plans(selected_wallet_id);
CREATE INDEX IF NOT EXISTS idx_vendor_plans_slots ON vendor_plans(max_traders, current_traders);

-- Update existing plans to have default values
UPDATE vendor_plans 
SET max_traders = 10, current_traders = 0 
WHERE max_traders IS NULL OR current_traders IS NULL;