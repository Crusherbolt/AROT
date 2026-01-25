import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GammaData {
  ticker: string;
  expiration: string;
  spotPrice: number;
  gammaFlip: number;
  putWall: number;
  callWall: number;
  totalGamma: number;
  netGamma: number;
  gammaNotional: number;
  deltaAdjustedGamma: number;
  strikes: StrikeData[];
  lastUpdate?: string;
}

export interface StrikeData {
  strike: number;
  callGamma: number;
  putGamma: number;
  netGamma: number;
  callOI: number;
  putOI: number;
}

export function useGammaData() {
  const [data, setData] = useState<GammaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGammaData = useCallback(async (ticker: string, expiration: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('fetch-gamma', {
        body: { ticker, expiration }
      });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (responseData?.success && responseData?.data) {
        setData(responseData.data);
      } else {
        throw new Error(responseData?.error || 'Failed to fetch gamma data');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch gamma data';
      setError(message);
      console.error('Gamma fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchGammaData };
}
