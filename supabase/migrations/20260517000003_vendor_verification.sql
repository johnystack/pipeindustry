-- Add vendor verification columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS vendor_verification_status TEXT DEFAULT 'not_applied' CHECK (vendor_verification_status IN ('not_applied', 'pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS vendor_verification_tx TEXT;

-- Policy to allow users to update their own verification status
CREATE POLICY "Users can update their own verification status" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
