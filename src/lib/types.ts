import React from 'react';

export interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: 'verified' | 'pending' | 'suspended';
  withdrawable_balance?: number;
  created_at?: string;
  referral_earnings?: number;
}

export interface Crypto {
  id: string;
  name: string;
  symbol: string;
  address: string;
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
  status: 'active' | 'completed' | 'withdrawn';
  amount: number;
  return?: number;
  approved_at: string;
  plan_name: string;
}

export interface StatsData {
  totalBalance?: number;
  activeInvestments?: number;
  totalEarnings?: number;
  withdrawableBalance?: number;
  referralEarnings?: number;
}

export interface Transaction {
  type: 'Investment' | 'Withdrawal' | 'Referral';
  plan?: string;
  amount: number | string;
  status: 'Completed' | 'Pending';
}