import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomBadge } from '@/components/ui/custom-badge';
import { Activity, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function FedWatch() {
  const [loading, setLoading] = useState(true);
  
  // Simulated data for FedWatch
  const [data, setData] = useState({
    meetingDate: "2026-03-18",
    probabilityHike: 12.5,
    probabilityCut: 65.2,
    probabilityHold: 22.3,
    currentRate: "5.25-5.50",
    targetRate: "5.00-5.25",
    lastUpdate: new Date()
  });

  useEffect(() => {
    // Simulate fetch logic
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <div className="rounded-lg border border-border bg-card p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">CME FedWatch Tool</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(data.lastUpdate, { addSuffix: true })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-muted-foreground">Next Meeting</p>
            <p className="font-medium text-sm">{new Date(data.meetingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Current Rate</p>
            <p className="font-mono font-bold text-primary">{data.currentRate}%</p>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Rate Cut Probability</span>
              <span className="font-bold text-bullish">{data.probabilityCut}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-bullish rounded-full" style={{ width: `${data.probabilityCut}%` }} />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Rate Hold Probability</span>
              <span className="font-bold text-muted-foreground">{data.probabilityHold}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-muted-foreground/50 rounded-full" style={{ width: `${data.probabilityHold}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Rate Hike Probability</span>
              <span className="font-bold text-bearish">{data.probabilityHike}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-bearish rounded-full" style={{ width: `${data.probabilityHike}%` }} />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">Target Rate: <span className="font-mono text-foreground font-medium">{data.targetRate}%</span></p>
        </div>
      </div>
    </div>
  );
}
