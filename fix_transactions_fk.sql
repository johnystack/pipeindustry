-- Fix orphan transactions (if any) and establish Foreign Key to profiles
DELETE FROM public.transactions 
WHERE user_id IS NOT NULL 
  AND user_id NOT IN (SELECT id FROM public.profiles);

ALTER TABLE public.transactions 
  DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

ALTER TABLE public.transactions 
  ADD CONSTRAINT transactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
