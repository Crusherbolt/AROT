import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function DataCard({ title, value, change, changeLabel, icon, className }: DataCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  const isNeutral = change === 0;

  return (
    <div className={cn(
      "p-4 rounded-lg bg-card border border-border transition-all duration-200 hover:border-primary/50",
      className
    )}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      
      <div className="flex items-end justify-between">
        <span className="text-2xl font-mono font-semibold">
          {value}
        </span>
        
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-mono",
            isPositive && "text-bullish",
            isNegative && "text-bearish",
            isNeutral && "text-muted-foreground"
          )}>
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {isNeutral && <Minus className="h-3 w-3" />}
            <span>
              {isPositive && '+'}{change.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
      
      {changeLabel && (
        <span className="text-xs text-muted-foreground mt-1 block">
          {changeLabel}
        </span>
      )}
    </div>
  );
}
