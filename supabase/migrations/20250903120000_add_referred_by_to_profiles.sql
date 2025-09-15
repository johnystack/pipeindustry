ALTER TABLE profiles
ADD COLUMN referred_by UUID REFERENCES auth.users(id);