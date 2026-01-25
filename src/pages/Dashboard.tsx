import { DataCard } from '@/components/ui/DataCard';
import { CustomBadge } from '@/components/ui/custom-badge';
import { useCOTData } from '@/hooks/useCOTData';
import { useNewsData } from '@/hooks/useNewsData';
import { BarChart3, Newspaper, Activity, Clock, TrendingUp, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FedWatch } from '@/components/dashboard/FedWatch';
import { AAIIWidget } from '@/components/dashboard/AAIIWidget';
import { MarketOverviewWidget } from '@/components/dashboard/MarketOverviewWidget';

export default function Dashboard() {
  const { data: cotData, lastUpdate } = useCOTData();
  const { news } = useNewsData();

  const topMovers = cotData.slice(0, 7).map(item => ({
    name: item.commodity,
    code: item.code,
    change: (item.commercialNet / item.openInterest) * 100,
    netPosition: item.commercialNet,
    oiChange: item.changeOI
  }));

  const formatNumber = (num: number) => {
    if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const recentNews = news.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time market analytics and insights
          </p>
        </div>
        {lastUpdate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}</span>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard
          title="COT Signals"
          value={cotData.length}
          icon={<BarChart3 className="h-4 w-4" />}
          changeLabel="Active instruments"
        />
        <DataCard
          title="News Today"
          value={news.length}
          change={12.5}
          icon={<Newspaper className="h-4 w-4" />}
        />
        <DataCard
          title="Market Mood"
          value="Bullish"
          icon={<TrendingUp className="h-4 w-4" />}
          changeLabel="Based on sentiment analysis"
        />
        <DataCard
          title="Active Sessions"
          value="London"
          icon={<Users className="h-4 w-4" />}
          changeLabel="NYSE opens in 2h 15m"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COT Overview */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">COT Net Positions</h2>
            </div>
            <Link to="/cot-reports" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>
          
          <div className="space-y-3">
            {topMovers.map((item, idx) => (
              <Link
                to={`/cot-reports?code=${item.code || item.name}`} 
                key={item.name}
                className="flex items-center justify-between p-3 rounded-md bg-surface hover:bg-surface-hover transition-colors cursor-pointer group"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs font-mono flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-medium block">{item.name}</span>
                    <span className="text-xs text-muted-foreground">Net: {formatNumber(item.netPosition)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <CustomBadge variant={item.change > 0 ? 'bullish' : 'bearish'}>
                      {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
                    </CustomBadge>
                  </div>
                  <span className={`text-xs ${item.oiChange >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                    OI: {item.oiChange > 0 ? '+' : ''}{formatNumber(item.oiChange)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Live News Feed */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-warning" />
              <h2 className="font-semibold">Live Feed</h2>
            </div>
            <Link to="/news" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentNews.map((item, idx) => (
              <div 
                key={item.id}
                className="p-3 rounded-md bg-surface hover:bg-surface-hover transition-colors animate-fade-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-start gap-2 mb-1">
                  <CustomBadge 
                    variant={
                      item.impact === 'high' ? 'bearish' : 
                      item.impact === 'medium' ? 'warning' : 'muted'
                    }
                  >
                    {item.impact.toUpperCase()}
                  </CustomBadge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm line-clamp-2">{item.title}</p>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {item.source}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FedWatch Widget (New) */}
        <div className="lg:col-span-1 rounded-lg border border-border bg-card p-0 overflow-hidden">
          <FedWatch />
        </div>

        {/* AAII Sentiment Widget (New) */}
        <div className="lg:col-span-1 rounded-lg border border-border bg-card p-0 overflow-hidden">
          <AAIIWidget />
        </div>

        {/* Market Overview Widget (New - Fills Empty Slot) */}
        <div className="lg:col-span-1 rounded-lg border border-border bg-card p-0 overflow-hidden">
          <MarketOverviewWidget />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          to="/cot-reports"
          className="group p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">COT Reports</h3>
              <p className="text-sm text-muted-foreground">Analyze positioning data</p>
            </div>
          </div>
        </Link>
        
        <Link 
          to="/news"
          className="group p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">News Feed</h3>
              <p className="text-sm text-muted-foreground">Real-time market news</p>
            </div>
          </div>
        </Link>
        
        <Link 
          to="/gamma"
          className="group p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Gamma/GEX</h3>
              <p className="text-sm text-muted-foreground">Options flow analysis</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
