import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';
import { Transaction } from '@/lib/types';

export const useWithdrawalHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (user) {
        setLoading(true);
        const { data, error } = await supabase
          .from('transactions')
          .select('*, receipt_url')
          .eq('user_id', user.id)
          .eq('type', 'withdrawal')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching withdrawal history:', error);
          setError(error);
        } else {
          setHistory(data);
        }
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  return { history, loading, error };
};