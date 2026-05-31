-- Fix Row Level Security (RLS) for investments table
-- This allows users to create investments and admins to manage them

-- 1. Ensure RLS is enabled
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view own investments" ON investments;
DROP POLICY IF EXISTS "Users can insert own investments" ON investments;
DROP POLICY IF EXISTS "Admins can update investments" ON investments;
DROP POLICY IF EXISTS "Admins can delete investments" ON investments;
DROP POLICY IF EXISTS "Anyone can view approved plans" ON vendor_plans; -- checking related table too

-- 3. Create proper policies for 'investments'

-- Allow users to view only their own investments, admins can see all
CREATE POLICY "Users can view own investments" ON investments
    FOR SELECT USING (
        auth.uid() = user_id 
        OR (auth.jwt() ->> 'role' = 'admin')
        OR (auth.jwt() ->> 'role' = 'vendor') -- Vendors might need to see trades related to them if implemented
    );

-- Allow authenticated users to create investments for themselves
CREATE POLICY "Users can insert own investments" ON investments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Allow admins to update any investment (for approval/rejection)
CREATE POLICY "Admins can update investments" ON investments
    FOR UPDATE USING (
        (auth.jwt() ->> 'role' = 'admin')
    );

-- Allow admins to delete investments if needed
CREATE POLICY "Admins can delete investments" ON investments
    FOR DELETE USING (
        (auth.jwt() ->> 'role' = 'admin')
    );

-- 4. Fix vendor_plans visibility if users can't see them to pick a plan
DROP POLICY IF EXISTS "Users can view approved plans" ON vendor_plans;
CREATE POLICY "Users can view approved plans" ON vendor_plans
    FOR SELECT USING (
        eligibility_status = 'approved' 
        OR auth.jwt() ->> 'role' = 'admin'
        OR (auth.jwt() ->> 'role' = 'vendor' AND vendor_id = auth.uid())
    );

-- Verify policies
SELECT * FROM pg_policies WHERE tablename IN ('investments', 'vendor_plans');