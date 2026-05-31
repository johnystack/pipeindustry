-- Add bank details columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_name TEXT;

-- Update RLS policies to ensure users can read and update their own bank details (should already be covered by general profile policies)
