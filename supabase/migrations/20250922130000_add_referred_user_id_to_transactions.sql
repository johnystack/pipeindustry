ALTER TABLE transactions
ADD COLUMN referred_user_id UUID REFERENCES auth.users(id);
