import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ETFFlowData {
  ticker: string;
  date: string;
  netFlow: number;
  inflow: number;
  outflow: number;
  volume: number;
  aum: number;
  flowTrend: 'bullish' | 'bearish' | 'neutral';
  history: ETFFlowHistoryItem[];
}

export interface ETFFlowHistoryItem {
  date: string;
  netFlow: number;
  inflow: number;
  outflow: number;
  cumulativeFlow: number;
}

export function useETFFlowData() {
  const [data, setData] = useState<ETFFlowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchETFFlowData = useCallback(async (ticker: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('fetch-etf-flow', {
        body: { ticker }
      });

      if (fetchError) throw new Error(fetchError.message);

      if (responseData?.success && responseData?.data) {
        setData(responseData.data);
      } else {
        throw new Error(responseData?.error || 'Failed to fetch ETF flow data');
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch ETF flow data';
      setError(message);
      console.error('ETF flow fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchETFFlowData };
}
