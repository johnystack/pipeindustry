-- ==============================================================================
-- UPDATE EXISTING VENDOR PLANS FOR NEW ASSET PRICES
-- Palladium: ?10,000
-- Iron Ore / Iron: ?10,000
-- Lithium: ?100,000
-- ==============================================================================

DO $$
BEGIN
  -- 1. Update Palladium plans to ?10,000
  UPDATE public.vendor_plans
  SET 
    min_investment = 10000,
    max_investment = 10000,
    fixed_limit = 10000
  WHERE asset_type = 'Palladium';

  -- 2. Update Iron Ore plans to ?10,000 (also handles 'Iron' if present)
  UPDATE public.vendor_plans
  SET 
    min_investment = 10000,
    max_investment = 10000,
    fixed_limit = 10000
  WHERE asset_type IN ('Iron Ore', 'Iron');

  -- 3. Update Lithium plans to ?100,000
  UPDATE public.vendor_plans
  SET 
    min_investment = 100000,
    max_investment = 100000,
    fixed_limit = 100000
  WHERE asset_type = 'Lithium';

  -- 4. If min_amount / max_amount columns exist, synchronize them as well
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendor_plans' AND column_name = 'min_amount'
  ) THEN
    UPDATE public.vendor_plans SET min_amount = 10000, max_amount = 10000 WHERE asset_type = 'Palladium';
    UPDATE public.vendor_plans SET min_amount = 10000, max_amount = 10000 WHERE asset_type IN ('Iron Ore', 'Iron');
    UPDATE public.vendor_plans SET min_amount = 100000, max_amount = 100000 WHERE asset_type = 'Lithium';
  END IF;
END $$;

-- 5. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

