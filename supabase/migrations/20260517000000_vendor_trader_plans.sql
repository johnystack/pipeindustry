-- Create vendor_plans table
CREATE TABLE vendor_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    min_investment NUMERIC NOT NULL DEFAULT 0,
    max_investment NUMERIC,
    duration_days INTEGER NOT NULL,
    daily_return_percent NUMERIC NOT NULL,
    features TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active', -- active, inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on vendor_plans
ALTER TABLE vendor_plans ENABLE ROW LEVEL SECURITY;

-- Policies for vendor_plans
CREATE POLICY "Vendor plans are viewable by everyone" ON vendor_plans
    FOR SELECT USING (true);

CREATE POLICY "Vendors can insert their own plans" ON vendor_plans
    FOR INSERT WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update their own plans" ON vendor_plans
    FOR UPDATE USING (auth.uid() = vendor_id);

-- Ensure profiles has a role column and 'vendor', 'trader' and 'admin' are supported
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'trader';
    END IF;
END $$;

-- Update existing profiles to have a role if they don't
UPDATE profiles SET role = 'trader' WHERE role IS NULL;

-- Add plan_id to investments to link to vendor_plans
ALTER TABLE investments ADD COLUMN plan_id UUID REFERENCES vendor_plans(id);
