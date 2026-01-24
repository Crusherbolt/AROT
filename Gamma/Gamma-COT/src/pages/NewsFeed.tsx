import { useState } from 'react';
import { useNewsData, NewsItem } from '@/hooks/useNewsData';
import { CustomBadge } from '@/components/ui/custom-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Filter, Volume2, VolumeX, 
  TrendingUp, TrendingDown, Minus,
  Clock, Zap
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function NewsFeed() {
  const { news, loading } = useNewsData();
  const [search, setSearch] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<NewsItem['category'] | 'all'>('all');
  const [impactFilter, setImpactFilter] = useState<NewsItem['impact'] | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const distinctSources = Array.from(new Set(news.map(n => n.source)));

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                          item.source.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesImpact = impactFilter === 'all' || item.impact === impactFilter;
    const matchesSource = sourceFilter === 'all' || item.source === sourceFilter;
    return matchesSearch && matchesCategory && matchesImpact && matchesSource;
  });

  const getSentimentIcon = (sentiment: NewsItem['sentiment']) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-bullish" />;
      case 'bearish': return <TrendingDown className="h-4 w-4 text-bearish" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getImpactColor = (impact: NewsItem['impact']) => {
    switch (impact) {
      case 'high': return 'bearish';
      case 'medium': return 'warning';
      default: return 'muted';
    }
  };

  const getCategoryColor = (category: NewsItem['category']) => {
    switch (category) {
      case 'forex': return 'bg-blue-500/10 text-blue-500';
      case 'stocks': return 'bg-green-500/10 text-green-500';
      case 'crypto': return 'bg-orange-500/10 text-orange-500';
      case 'commodities': return 'bg-yellow-500/10 text-yellow-500';
      case 'economy': return 'bg-purple-500/10 text-purple-500';
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">News Feed</h1>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-bearish/10 text-bearish text-xs font-medium">
              <Zap className="h-3 w-3" />
              LIVE
            </div>
          </div>
          <p className="text-muted-foreground mt-1">
            Real-time market news and events
          </p>
        </div>
        
        <Button 
          variant={soundEnabled ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? (
            <><Volume2 className="h-4 w-4 mr-2" /> Sound On</>
          ) : (
            <><VolumeX className="h-4 w-4 mr-2" /> Sound Off</>
          )}
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search news..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 border border-border ${showFilters ? 'bg-accent text-accent-foreground' : ''}`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Collapsible Filters (Category, Impact, Source) */}
        {showFilters && (
          <div className="p-4 rounded-lg border border-border bg-surface/50 space-y-4 animate-fade-down">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground w-16">Category:</span>
              {(['all', 'forex', 'stocks', 'crypto', 'commodities', 'economy'] as const).map(cat => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground w-16">Impact:</span>
              {(['all', 'high', 'medium', 'low'] as const).map(imp => (
                <Button
                  key={imp}
                  variant={impactFilter === imp ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => setImpactFilter(imp)}
                >
                  {imp.charAt(0).toUpperCase() + imp.slice(1)}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-sm text-muted-foreground w-16 flex-shrink-0">Source:</span>
              <Button
                variant={sourceFilter === 'all' ? 'default' : 'outline'}
                size="xs"
                onClick={() => setSourceFilter('all')}
              >
                All Sources
              </Button>
              {distinctSources.map(source => (
                <Button
                  key={source}
                  variant={sourceFilter === source ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => setSourceFilter(source)}
                  className="whitespace-nowrap"
                >
                  {source}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* News Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-2">
          {filteredNews.map((item, idx) => (
            <a
              key={item.id}
              href={item.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-surface-hover transition-all animate-fade-up group"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1">
                  {getSentimentIcon(item.sentiment)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <CustomBadge variant={getImpactColor(item.impact) as any}>
                      {item.impact.toUpperCase()}
                    </CustomBadge>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(item.category)}`}>
                      {item.category.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                    {item.title}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{item.source}</span>
                      <span>•</span>
                      <span>{format(item.timestamp, 'HH:mm:ss')}</span>
                    </div>
                    {item.url && (
                      <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        Read more →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="p-4 rounded-lg border border-border bg-card">
            <h3 className="font-semibold mb-4">Today's Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total News</span>
                <span className="font-mono">{news.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">High Impact</span>
                <span className="font-mono text-bearish">
                  {news.filter(n => n.impact === 'high').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bullish Sentiment</span>
                <span className="font-mono text-bullish">
                  {news.filter(n => n.sentiment === 'bullish').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bearish Sentiment</span>
                <span className="font-mono text-bearish">
                  {news.filter(n => n.sentiment === 'bearish').length}
                </span>
              </div>
            </div>
          </div>

          {/* Source Stats */}
          <div className="p-4 rounded-lg border border-border bg-card">
            <h3 className="font-semibold mb-4">Top Sources</h3>
            <div className="space-y-2">
              {Array.from(new Set(news.map(n => n.source)))
                .map(source => ({
                  source,
                  count: news.filter(n => n.source === source).length
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map(({ source, count }) => (
                  <div key={source} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{source}</span>
                    <span className="font-mono">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
