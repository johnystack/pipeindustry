ALTER TABLE public.transactions
ADD CONSTRAINT transactions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id);