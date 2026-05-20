-- Check current policies on vendor_plans table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'vendor_plans';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Vendors can manage their own plans" ON vendor_plans;
DROP POLICY IF EXISTS "Admins can manage all plans" ON vendor_plans;
DROP POLICY IF EXISTS "Users can view approved plans" ON vendor_plans;

-- Create proper policies for vendor_plans table
CREATE POLICY "Vendors can manage their own plans" ON vendor_plans
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'vendor' AND vendor_id = auth.uid()
        OR auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Admins can manage all plans" ON vendor_plans
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view approved plans" ON vendor_plans
    FOR SELECT USING (
        eligibility_status = 'approved' 
        OR auth.jwt() ->> 'role' = 'admin'
        OR (auth.jwt() ->> 'role' = 'vendor' AND vendor_id = auth.uid())
    );

-- Ensure RLS is enabled
ALTER TABLE vendor_plans ENABLE ROW LEVEL SECURITY;