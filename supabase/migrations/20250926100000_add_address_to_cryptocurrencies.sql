ALTER TABLE public.cryptocurrencies
ADD COLUMN address TEXT;

-- Optional: Add a default address to existing rows if you want
UPDATE public.cryptocurrencies SET address = '' WHERE address IS NULL;
