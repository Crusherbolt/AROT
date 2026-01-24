import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomBadge } from '@/components/ui/custom-badge';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export function AAIIWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetch
    setTimeout(() => {
      setData({
        bullish: 44.5,
        bearish: 25.3,
        neutral: 30.2,
        bullChange: 2.1,
        lastUpdate: new Date()
      });
      setLoading(false);
    }, 800);
  }, []);

  if (loading || !data) return <div className="h-full bg-card rounded-lg border border-border p-4 animate-pulse" />;

  return (
    <Link to="/aaii" className="block h-full cursor-pointer group">
      <div className="rounded-lg border border-border bg-card p-4 h-full hover:border-primary/50 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-bullish" />
            <h3 className="font-semibold group-hover:text-primary transition-colors">AAII Sentiment</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
             <Clock className="h-3 w-3" />
             <span>Weekly</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Bullish</span>
              <span className="font-bold text-bullish">{data.bullish}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-bullish rounded-full" style={{ width: `${data.bullish}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +{data.bullChange}% from last week
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-surface p-2 rounded text-center">
              <div className="text-xs text-muted-foreground">Bearish</div>
              <div className="font-bold text-bearish">{data.bearish}%</div>
            </div>
            <div className="bg-surface p-2 rounded text-center">
              <div className="text-xs text-muted-foreground">Neutral</div>
              <div className="font-bold text-foreground">{data.neutral}%</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
