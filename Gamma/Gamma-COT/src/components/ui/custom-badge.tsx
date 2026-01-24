import { cn } from '@/lib/utils';

interface CustomBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'bullish' | 'bearish' | 'warning' | 'muted';
  className?: string;
}

export function CustomBadge({ children, variant = 'default', className }: CustomBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
      variant === 'default' && "bg-primary/10 text-primary",
      variant === 'bullish' && "bg-bullish/10 text-bullish",
      variant === 'bearish' && "bg-bearish/10 text-bearish",
      variant === 'warning' && "bg-warning/10 text-warning",
      variant === 'muted' && "bg-muted text-muted-foreground",
      className
    )}>
      {children}
    </span>
  );
}
