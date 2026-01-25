import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Globe, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CustomBadge } from '@/components/ui/custom-badge';

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  type: 'index' | 'crypto' | 'commodities' | 'forex';
}

export function MarketOverviewWidget() {
  const [markets, setMarkets] = useState<MarketItem[]>([
    { symbol: 'SPX', name: 'S&P 500', price: 4890.25, change: 0.45, type: 'index' },
    { symbol: 'NDX', name: 'Nasdaq 100', price: 17350.10, change: 0.82, type: 'index' },
    { symbol: 'BTC', name: 'Bitcoin', price: 65230.00, change: 2.15, type: 'crypto' },
    { symbol: 'GC', name: 'Gold', price: 2045.50, change: -0.25, type: 'commodities' },
    { symbol: 'CL', name: 'Crude Oil', price: 76.80, change: 1.10, type: 'commodities' },
    { symbol: 'EUR/USD', name: 'Euro', price: 1.0850, change: -0.15, type: 'forex' },
  ]);

  // Simulate live price ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setMarkets(prev => prev.map(m => ({
        ...m,
        price: m.price * (1 + (Math.random() - 0.5) * 0.0005), // Micro variations
        change: m.change + (Math.random() - 0.5) * 0.05
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full rounded-lg border border-border bg-card p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Global Markets</h3>
        </div>
        <div className="flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-muted-foreground ml-1">Live</span>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
        {markets.map((m) => (
          <div key={m.symbol} className="flex items-center justify-between p-2 rounded bg-surface hover:bg-surface-hover transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded ${
                m.type === 'index' ? 'bg-blue-500/10 text-blue-500' :
                m.type === 'crypto' ? 'bg-orange-500/10 text-orange-500' :
                m.type === 'forex' ? 'bg-green-500/10 text-green-500' :
                'bg-yellow-500/10 text-yellow-500'
              }`}>
                {m.type === 'index' ? <Activity className="h-4 w-4" /> : 
                 m.type === 'crypto' ? <TrendingUp className="h-4 w-4" /> :
                 <Globe className="h-4 w-4" />}
              </div>
              <div>
                <div className="font-medium text-sm">{m.symbol}</div>
                <div className="text-xs text-muted-foreground">{m.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-medium">
                {m.type === 'forex' ? m.price.toFixed(4) : m.price.toFixed(2)}
              </div>
              <div className={`text-xs font-medium flex items-center justify-end gap-1 ${m.change >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                {m.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {m.change > 0 ? '+' : ''}{m.change.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-border">
          <Link to="/gamma" className="text-xs text-center block text-muted-foreground hover:text-primary transition-colors">
              View Detailed Analysis →
          </Link>
      </div>
    </div>
  );
}
