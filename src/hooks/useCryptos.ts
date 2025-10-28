import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Crypto } from '@/lib/types';

export const useCryptos = () => {
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchCryptos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('cryptocurrencies')
        .select('*, address');

      if (error) {
        console.error('Error fetching cryptocurrencies:', error);
        setError(error);
      } else {
        setCryptos(data);
      }
      setLoading(false);
    };

    fetchCryptos();
  }, []);

  return { cryptos, loading, error };
};