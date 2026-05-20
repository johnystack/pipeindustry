-- Create company payment wallets table (for vendor commitment fees)
CREATE TABLE IF NOT EXISTS vendor_payment_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    address TEXT NOT NULL,
    network TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default company wallet addresses for vendor payments
INSERT INTO vendor_payment_wallets (name, symbol, address, network) VALUES
('Bitcoin', 'BTC', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'Bitcoin'),
('Ethereum', 'ETH', '0x742d35Cc6634C0532925a3b8D4C9db96590b5c8e', 'Ethereum'),
('Tether USDT', 'USDT', 'TQn9Y2khEsLJW1ChVWFMSMeRDow5oREqjK', 'Tron TRC20'),
('USDC', 'USDC', '0x742d35Cc6634C0532925a3b8D4C9db96590b5c8e', 'Ethereum ERC20');

-- Enable RLS
ALTER TABLE vendor_payment_wallets ENABLE ROW LEVEL SECURITY;

-- Create policies (only vendors and admins can see company wallets)
CREATE POLICY "Vendors can view company payment wallets" ON vendor_payment_wallets
    FOR SELECT USING (auth.jwt() ->> 'role' = 'vendor' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage company payment wallets" ON vendor_payment_wallets
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');