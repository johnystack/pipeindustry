
-- Add fee column to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS fee NUMERIC DEFAULT 0;

-- Update settings with new withdrawal fee
UPDATE public.settings SET withdrawal_fee_percent = 6.67 WHERE id = 1;
