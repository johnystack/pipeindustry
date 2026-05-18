import React from 'react';
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: 'verified' | 'pending' | 'suspended';
  withdrawable_balance?: number;
  created_at?: string;
  referral_earnings?: number;
  username?: string;
  role?: string;
}

export interface Crypto {
  id: string;
  name: string;
  symbol: string;
  address: string;
  color?: string;
  network?: string;
  min_withdraw?: number;
  fee?: number;
}

export interface AdminStat {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  change?: string;
}

export interface Investment {
  id: string;
  status: 'active' | 'completed' | 'withdrawn' | 'pending' | 'denied';
  amount: number;
  return?: number;
  approved_at: string;
  plan_name: string;
  user_id: string;
  crypto: string;
  duration: number;
  plan_id?: string;
}

export interface VendorPlan {
  id: string;
  vendor_id: string;
  name: string;
  min_investment: number;
  max_investment?: number;
  duration_days: number;
  daily_return_percent: number;
  features: string[];
  status: 'active' | 'inactive';
  created_at: string;
  vendor_name?: string;
  asset_type?: 
    | 'Gold' | 'Lithium' | 'Crude Oil' | 'Nickel' | 'Silver' 
    | 'Bitcoin' | 'Natural Gas' | 'Copper' | 'Platinum' 
    | 'Palladium' | 'Iron Ore' | 'Aluminum' 
    | 'Corn' | 'Soybeans';
  payment_details?: string;
  fixed_limit?: number;
  eligibility_status?: 'pending' | 'approved' | 'rejected';
  eligibility_tx?: string;
}

export interface StatsData {
  totalBalance?: number;
  activeInvestments?: number;
  totalEarnings?: number;
  withdrawableBalance?: number;
  referralEarnings?: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'profit' | 'investment' | 'referral' | 'bonus';
  status: 'completed' | 'pending' | 'processing' | 'failed';
  amount: number;
  description?: string;
  reference?: string;
  date?: string;
  fee?: string;
  plan?: string;
  withdrawal_type?: 'to_wallet' | 'to_balance';
  address?: string;
  created_at?: string;
}

export interface Deposit {
  id: string;
  status: 'completed' | 'pending';
  amount: number;
  crypto: string;
  usdValue: string;
  date: string;
}

export interface Referral {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  status: 'Active' | 'Inactive';
  invested: string;
  commission: string;
}

export interface CommissionEarning {
  id: string;
  description: string;
  reference: string;
  created_at: string;
  amount: number;
}

export interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  role: string | null;
  loading: boolean;
}
