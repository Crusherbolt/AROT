import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomBadge } from '@/components/ui/custom-badge';
import { TrendingUp, TrendingDown, Minus, Clock, BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AAIISentiment() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate mock AAII data
  useEffect(() => {
    const historicalData = [];
    let bull = 35;
    let bear = 30;
    
    for (let i = 0; i < 52; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7)); // Weekly data
      
      // Random walk
      bull += (Math.random() - 0.5) * 5;
      bear += (Math.random() - 0.5) * 5;
      
      // Normalize
      if (bull < 20) bull = 20;
      if (bear < 20) bear = 20;
      let neutral = 100 - bull - bear;
      if (neutral < 15) neutral = 15;
      
      // Renormalize total to 100
      const total = bull + bear + neutral;
      bull = (bull / total) * 100;
      bear = (bear / total) * 100;
      neutral = (neutral / total) * 100;

      historicalData.push({
        date: date.toISOString(),
        bullish: bull,
        bearish: bear,
        neutral: neutral,
        spread: bull - bear
      });
    }
    setData(historicalData.reverse());
    setLoading(false);
  }, []);

  const latest = data[data.length - 1] || { bullish: 0, bearish: 0, neutral: 0, spread: 0 };
  const prev = data[data.length - 2] || { bullish: 0, bearish: 0, neutral: 0, spread: 0 };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AAII Investor Sentiment</h1>
          <p className="text-muted-foreground mt-1">
            American Association of Individual Investors Sentiment Survey
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Updated Weekly</span>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-bullish/30 bg-bullish/5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-bullish">Bullish</span>
            <TrendingUp className="h-4 w-4 text-bullish" />
          </div>
          <div className="text-2xl font-bold text-bullish">{latest.bullish.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground mt-1">
            {latest.bullish > prev.bullish ? '+' : ''}{(latest.bullish - prev.bullish).toFixed(1)}% vs last week
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-muted-foreground">Neutral</span>
            <Minus className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground">{latest.neutral.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground mt-1">
            {latest.neutral > prev.neutral ? '+' : ''}{(latest.neutral - prev.neutral).toFixed(1)}% vs last week
          </div>
        </div>

        <div className="p-4 rounded-lg border border-bearish/30 bg-bearish/5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-bearish">Bearish</span>
            <TrendingDown className="h-4 w-4 text-bearish" />
          </div>
          <div className="text-2xl font-bold text-bearish">{latest.bearish.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground mt-1">
            {latest.bearish > prev.bearish ? '+' : ''}{(latest.bearish - prev.bearish).toFixed(1)}% vs last week
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-primary">Bull-Bear Spread</span>
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div className={`text-2xl font-bold ${latest.spread >= 0 ? 'text-bullish' : 'text-bearish'}`}>
            {latest.spread > 0 ? '+' : ''}{latest.spread.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Sentiment is {latest.spread > 0 ? 'Net Bullish' : 'Net Bearish'}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6 rounded-lg border border-border bg-card">
        <h3 className="text-lg font-semibold mb-6">Historical Sentiment Trend (1 Year)</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="bullGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--bullish))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--bullish))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="bearGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--bearish))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--bearish))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short' })}
                fontSize={12}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px'
                }}
                labelFormatter={(l) => new Date(l).toLocaleDateString()}
              />
              <Area 
                type="monotone" 
                dataKey="bullish" 
                name="Bullish %" 
                stroke="hsl(var(--bullish))" 
                fill="url(#bullGradient)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="bearish" 
                name="Bearish %" 
                stroke="hsl(var(--bearish))" 
                fill="url(#bearGradient)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-surface border border-border">
        <h4 className="font-semibold mb-2">About AAII Sentiment</h4>
        <p className="text-sm text-muted-foreground">
          The AAII Sentiment Survey measures the percentage of individual investors who are bullish, bearish, and neutral on the stock market for the next six months. 
          Historically, the survey is often used as a contrarian indicator: excessive bullishness can suggest a market top, while excessive bearishness can signal a market bottom.
        </p>
      </div>
    </div>
  );
}
