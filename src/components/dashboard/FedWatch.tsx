import { useFedWatchData } from '@/hooks/useFedWatchData';
import { CustomBadge } from '@/components/ui/custom-badge';
import { Activity, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function FedWatch() {
  const { data, loading, error, refetch } = useFedWatchData();

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 h-full flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 h-full flex flex-col items-center justify-center text-center">
        <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-muted-foreground text-sm mb-2">{error || 'Unable to load FedWatch data'}</p>
        <button 
          onClick={refetch}
          className="text-xs text-primary hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Format data for chart
  const chartData = data.probabilities.map(p => ({
    name: p.label,
    val: p.probability,
    // Color logic: if max < current rate (5.25), it's a cut (bullish/green)
    // if min > current rate (5.50), it's a hike (bearish/red)
    // else hold (gray)
    color: p.max <= 5.25 ? 'hsl(var(--bullish))' : (p.min >= 5.50 ? 'hsl(var(--bearish))' : 'hsl(var(--muted-foreground))')
  }));

  return (
    <div className="rounded-lg border border-border bg-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">CME FedWatch Tool</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={refetch} 
            className="p-1 hover:bg-surface rounded transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(data.lastUpdate), { addSuffix: true })}
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-muted-foreground">Next Meeting</p>
            <p className="font-medium text-sm text-foreground">
              {data.nextMeeting.label}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Current Rate</p>
            <p className="font-mono font-bold text-primary">{data.currentRate}%</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Target Rate Probabilities
          </p>
          
          {data.probabilities.slice(0, 3).map((prob, idx) => (
            <div key={prob.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-mono text-xs text-muted-foreground">{prob.label}%</span>
                <span className={`font-bold ${prob.probability > 50 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {prob.probability}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    prob.max <= 5.25 ? 'bg-bullish' : (prob.min >= 5.50 ? 'bg-bearish' : 'bg-muted-foreground')
                  }`} 
                  style={{ width: `${prob.probability}%` }} 
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border mt-auto">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Implied Rate:</span>
            <span className="font-mono text-foreground font-medium">{data.impliedRate.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between text-xs mb-3">
            <span className="text-muted-foreground">Cuts Priced In:</span>
            <span className="font-mono text-foreground font-medium">{data.expectedCuts}</span>
          </div>
          
          <div className="h-32 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} interval={0} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                  formatter={(val: number) => [`${val}%`, 'Probability']}
                />
                <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            Source: {data.source}
          </p>
        </div>
      </div>
    </div>
  );
}
