-- ==============================================================================
-- FIX PREMATURE INVESTMENT COMPLETION & RESTORE ACTIVE STATUS FOR 6-STAGE CLAIMS
-- ==============================================================================

-- 1. Redefine update_due_investments so it NEVER prematurely marks investments as 'completed'
-- based on days elapsed while claims remain unclaimed.
CREATE OR REPLACE FUNCTION public.update_due_investments()
RETURNS void AS $$
BEGIN
  -- An investment only concludes when all 6 milestone claims (150% total ROI) are fulfilled
  UPDATE public.investments
  SET status = 'completed'
  WHERE status = 'active'
    AND COALESCE(claimed_amount, 0) >= (amount * 1.5);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Restore any investments that were prematurely marked 'completed' back to 'active'
-- if they still have unclaimed stages and haven't been reinvested.
UPDATE public.investments
SET 
  status = 'active',
  commission_paid = false
WHERE status = 'completed'
  AND COALESCE(claimed_amount, 0) < (amount * 1.5)
  AND COALESCE(reinvested, false) = false;

-- 3. Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
