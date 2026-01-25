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
    // ... (Mock logic can be simplified or kept as fallback)
    const sources = ['FinancialJuice', 'Reuters', 'Bloomberg', 'FXStreet', 'CNBC'];
    return Array.from({ length: 15 }).map((_, i) => ({
      id: `news-${i}`,
      timestamp: new Date(Date.now() - Math.random() * 3600000), // Recent
      title: "Mock Headline: Market volatility increases ahead of Fed decision",
      source: sources[i % sources.length],
      impact: 'medium',
      category: 'economy',
      sentiment: 'neutral',
      summary: "Full story available at source...",
      url: "#"
    })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) as NewsItem[];
  };

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Live Aggregator (Client-Side)
      const feeds = [
        { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,EURUSD=X,BTC-USD,GC=F,CL=F', source: 'Yahoo Finance' },
        { url: 'https://www.financialjuice.com/feed.ashx?xy=rss', source: 'FinancialJuice' },
        { url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html', source: 'CNBC Finance' },
        { url: 'https://www.fxstreet.com/rss/news', source: 'FXStreet' },
        { url: 'https://www.investing.com/rss/news.rss', source: 'Investing.com' }
      ];

      const fetchPromises = feeds.map(feed =>
        fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`)
          .then(res => res.json())
          .then(data => ({ ...data, _siteSource: feed.source }))
          .catch(err => {
            console.warn(`Failed to fetch ${feed.source}`, err);
            return null;
          })
      );

      const results = await Promise.all(fetchPromises);
      const allItems: any[] = [];

      results.forEach(data => {
        if (data && data.status === 'ok' && data.items) {
          data.items.forEach((item: any) => {
            let cat: NewsItem['category'] = 'economy';
            const title = (item.title || '').toLowerCase();
            const src = (data._siteSource || '').toLowerCase();

            if (title.includes('crypto')) cat = 'crypto';
            else if (title.includes('stock') || title.includes('dow') || title.includes('nasdaq')) cat = 'stocks';
            else if (title.includes('oil') || title.includes('gold')) cat = 'commodities';
            else if (title.includes('eur') || title.includes('usd') || title.includes('fx')) cat = 'forex';

            if (src.includes('fxstreet') || src.includes('financialjuice')) {
              if (!cat || cat === 'economy') cat = 'forex'; // Default for Squawk sources
            }

            const impact: NewsItem['impact'] = title.includes('fed') || title.includes('rate') || title.includes('inflation') || title.includes('gdp') ? 'high' : 'medium';

            // TIMEZONE FIX: rss2json often returns 'YYYY-MM-DD HH:mm:ss' (UTC) without Z.
            // Browser interprets this as Local. We must force it to be UTC.
            let pubDate = item.pubDate;
            if (typeof pubDate === 'string' && !pubDate.includes('Z') && !pubDate.includes('+')) {
              // If it looks like '2026-01-25 06:00:00', treat as UTC
              pubDate = pubDate.replace(' ', 'T') + 'Z';
            }
            let timestamp = new Date(pubDate);
            if (isNaN(timestamp.getTime())) timestamp = new Date(item.pubDate); // Fallback

            allItems.push({
              id: item.guid || Math.random().toString(36),
              timestamp: timestamp,
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
        // Sort Logic: Time first, then Priority
        allItems.sort((a, b) => {
          const timeDiff = b.timestamp.getTime() - a.timestamp.getTime();
          if (Math.abs(timeDiff) < 120000) { // If within 2 minutes
            // Give preference to FinancialJuice and Reuters
            const scoreA = (a.source === 'FinancialJuice' || a.source === 'Reuters') ? 1 : 0;
            const scoreB = (b.source === 'FinancialJuice' || b.source === 'Reuters') ? 1 : 0;
            return scoreB - scoreA;
          }
          return timeDiff;
        });

        // Dedup by Title
        const unique = allItems.filter((item, index, self) =>
          index === self.findIndex((t) => (t.title === item.title))
        );
        setNews(unique.slice(0, 60));
        setLoading(false);
        return;
      }

      // 2. Fallback to Local Snapshot
      const response = await fetch('/data/news.json');
      if (response.ok) {
        const localNews = await response.json();
        if (localNews && localNews.length > 0) {
          const formatted = localNews.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
          // Ensure snapshot is sorted too
          formatted.sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime());
          setNews(formatted);
          setLoading(false);
          return;
        }
      }

      setNews(generateMockNews());
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
