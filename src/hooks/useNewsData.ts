import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NewsItem {
  id: string;
  timestamp: Date;
  title: string;
  source: string;
  impact: 'high' | 'medium' | 'low';
  category: 'forex' | 'stocks' | 'crypto' | 'commodities' | 'economy';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  summary?: string;
  url?: string;
  image?: string;
}

export function useNewsData() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateMockNews = () => {
    // ... (Mock generation logic same as before) ...
    // Simplified for brevity in this overwrite, but crucial to keep valid fallback
    const sources = ['Bloomberg', 'Reuters', 'FinancialJuice', 'FXStreet', 'CNBC', 'ZeroHedge'];
    const headlines = [
      { t: "Fed's Powell signals potential rate cut in upcoming meeting", c: 'economy', s: 'bullish', i: 'high' },
      { t: "Oil prices surge as geopolitical tensions rise in Middle East", c: 'commodities', s: 'bullish', i: 'high' },
      { t: "ECB holds rates steady, warns of persistent inflation", c: 'forex', s: 'bearish', i: 'medium' },
      { t: "Tech stocks rally on better-than-expected earnings reports", c: 'stocks', s: 'bullish', i: 'medium' },
      { t: "Bitcoin reclaims $65k level as ETF inflows accelerate", c: 'crypto', s: 'bullish', i: 'medium' }
    ];
    // Fill up to 20 items
    return Array.from({ length: 20 }).map((_, i) => ({
      id: `news-${i}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      title: headlines[i % headlines.length].t,
      source: sources[Math.floor(Math.random() * sources.length)],
      impact: headlines[i % headlines.length].i as any,
      category: headlines[i % headlines.length].c as any,
      sentiment: headlines[i % headlines.length].s as any,
      summary: "Full story available at source...",
      url: `https://www.google.com/search?q=${encodeURIComponent(headlines[i % headlines.length].t + " finance news")}`
    })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Live Aggregator (Client-Side)
      const feeds = [
        { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,EURUSD=X,BTC-USD,GC=F,CL=F', source: 'Yahoo Finance' },
        { url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html', source: 'CNBC Finance' },
        { url: 'https://www.fxstreet.com/rss/news', source: 'FXStreet' }, // The "Squawk" Alternative
        { url: 'https://www.investing.com/rss/news.rss', source: 'Investing.com' }
      ];

      const fetchPromises = feeds.map(feed =>
        fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`)
          .then(res => res.json())
          .then(data => ({ ...data, _siteSource: feed.source }))
          .catch(() => null)
      );

      const results = await Promise.all(fetchPromises);
      const allItems: any[] = [];

      results.forEach(data => {
        if (data && data.status === 'ok' && data.items) {
          data.items.forEach((item: any) => {
            let cat: NewsItem['category'] = 'economy';
            const title = (item.title || '').toLowerCase();
            const src = (data._siteSource || '').toLowerCase();

            if (title.includes('crypto') || title.includes('bitcoin')) cat = 'crypto';
            else if (title.includes('stock') || title.includes('dow') || title.includes('nasdaq')) cat = 'stocks';
            else if (title.includes('oil') || title.includes('gold')) cat = 'commodities';
            else if (title.includes('eur') || title.includes('usd') || title.includes('fx')) cat = 'forex';

            // FXStreet is mostly Forex/Macro
            if (src.includes('fxstreet')) {
              if (!cat || cat === 'economy') cat = 'forex';
            }

            const impact: NewsItem['impact'] = title.includes('fed') || title.includes('rate') || title.includes('inflation') || title.includes('gdp') ? 'high' : 'medium';

            allItems.push({
              id: item.guid || Math.random().toString(36),
              timestamp: new Date(item.pubDate),
              title: item.title,
              source: data._siteSource || 'News',
              impact: impact,
              category: cat,
              sentiment: 'neutral',
              summary: item.description?.replace(/<[^>]*>/g, '').slice(0, 150) + '...',
              url: item.link
            });
          });
        }
      });

      if (allItems.length > 0) {
        allItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        // Dedup
        const unique = allItems.filter((item, index, self) =>
          index === self.findIndex((t) => (t.title === item.title))
        );
        setNews(unique.slice(0, 60));
        setLoading(false);
        return;
      }

      // 2. Local Snapshot Fallback
      const response = await fetch('/data/news.json');
      if (response.ok) {
        const localNews = await response.json();
        if (localNews && localNews.length > 0) {
          const formatted = localNews.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
          setNews(formatted);
          setLoading(false);
          return;
        }
      }

      // 3. Supabase Fallback
      const { data: dbNews } = await (supabase
        .from('news' as any)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50)) as any;

      if (dbNews && dbNews.length > 0) {
        const formattedNews: NewsItem[] = dbNews.map((item: any) => ({
          id: item.id,
          timestamp: new Date(item.timestamp),
          title: item.title,
          source: item.source || 'Unknown',
          impact: item.impact || 'low',
          category: item.category || 'economy',
          sentiment: item.sentiment || 'neutral',
          summary: item.summary,
          url: item.url,
          image: item.image
        }));
        setNews(formattedNews);
      } else {
        setNews(generateMockNews());
      }
    } catch (err) {
      console.warn('News fetch failed:', err);
      setNews(generateMockNews());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 60000); // 1 min update
    return () => clearInterval(interval);
  }, [fetchNews]);

  return { news, loading, error, refetch: fetchNews };
}
