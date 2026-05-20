-- Add payment proof functionality to investments
ALTER TABLE investments 
ADD COLUMN IF NOT EXISTS payment_proof TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Update investment status enum to include new statuses
-- awaiting_proof: Investment created, waiting for payment proof
-- pending: Payment proof uploaded, waiting for admin approval  
-- approved: Admin approved, investment is active
-- rejected: Admin rejected the investment
-- completed: Investment has finished its duration
-- withdrawn: User has withdrawn the returns

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
CREATE INDEX IF NOT EXISTS idx_investments_user_status ON investments(user_id, status);