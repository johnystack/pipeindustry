
-- Add commission tracking columns to investments
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT FALSE;

-- Update the claim_investment_assets function to ensure it marks investments as completed on the 6th claim
-- The current function already sets status = 'completed' if claimed_amount >= amount * 1.5.

-- We also need to make sure that the 'withdrawal_fee_percent' in settings is set to 6.67
UPDATE public.settings SET withdrawal_fee_percent = 6.67 WHERE id = 1;
