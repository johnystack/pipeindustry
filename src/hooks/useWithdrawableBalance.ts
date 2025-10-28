import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';

export const useWithdrawableBalance = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (user) {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('withdrawable_balance')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching withdrawable balance:', error);
          setError(error);
        } else {
          setBalance(data?.withdrawable_balance || 0);
        }
        setLoading(false);
      }
    };

    fetchBalance();
  }, [user]);

  return { balance, loading, error };
};