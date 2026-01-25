import { useState, useCallback } from 'react';

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

const popularETFs = ['SPY', 'QQQ', 'IWM', 'DIA', 'XLF', 'XLE', 'XLK', 'GLD', 'TLT', 'HYG'];

export function useETFFlowData() {
  const [data, setData] = useState<ETFFlowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchETFFlowData = useCallback(async (ticker: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate ETF flow data (in production, connect to real ETF flow API)
      const upperTicker = ticker.toUpperCase();
      
      // Generate realistic flow data based on ticker
      const baseFlow = popularETFs.includes(upperTicker) 
        ? (Math.random() - 0.5) * 2000 
        : (Math.random() - 0.5) * 500;
      
      const history: ETFFlowHistoryItem[] = [];
      let cumulative = 0;
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayFlow = baseFlow + (Math.random() - 0.5) * 500;
        cumulative += dayFlow;
        
        history.push({
          date: date.toISOString().split('T')[0],
          netFlow: Math.round(dayFlow),
          inflow: Math.round(Math.max(0, dayFlow) + Math.random() * 200),
          outflow: Math.round(Math.abs(Math.min(0, dayFlow)) + Math.random() * 200),
          cumulativeFlow: Math.round(cumulative),
        });
      }
      
      const latestFlow = history[history.length - 1];
      const weeklyAvg = history.slice(-5).reduce((sum, h) => sum + h.netFlow, 0) / 5;
      
      const flowData: ETFFlowData = {
        ticker: upperTicker,
        date: new Date().toISOString().split('T')[0],
        netFlow: latestFlow.netFlow,
        inflow: latestFlow.inflow,
        outflow: latestFlow.outflow,
        volume: Math.round(50000000 + Math.random() * 100000000),
        aum: Math.round(100000 + Math.random() * 500000),
        flowTrend: weeklyAvg > 100 ? 'bullish' : weeklyAvg < -100 ? 'bearish' : 'neutral',
        history,
      };
      
      setData(flowData);
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
