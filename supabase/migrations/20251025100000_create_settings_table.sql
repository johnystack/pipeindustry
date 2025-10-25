
CREATE TABLE public.settings (
  id bigint NOT NULL DEFAULT 1,
  min_withdrawal_amount numeric DEFAULT 50,
  max_withdrawal_amount numeric DEFAULT 10000,
  withdrawal_fee_percent numeric DEFAULT 2,
  level1_commission_percent numeric DEFAULT 10,
  level2_commission_percent numeric DEFAULT 5,
  level3_commission_percent numeric DEFAULT 2,
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);

-- Insert a single row of settings
INSERT INTO public.settings (id) VALUES (1);
