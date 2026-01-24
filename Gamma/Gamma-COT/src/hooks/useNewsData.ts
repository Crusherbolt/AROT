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
    const sources = ['Bloomberg', 'Reuters', 'FinancialJuice', 'FXStreet', 'CNBC', 'ZeroHedge'];
    const impacts: NewsItem['impact'][] = ['low', 'medium', 'high'];
    const categories: NewsItem['category'][] = ['forex', 'stocks', 'economy', 'commodities', 'crypto'];
    const sentiments: NewsItem['sentiment'][] = ['bullish', 'bearish', 'neutral'];

    const headlines = [
      { t: "Fed's Powell signals potential rate cut in upcoming meeting", c: 'economy', s: 'bullish', i: 'high' },
      { t: "Oil prices surge as geopolitical tensions rise in Middle East", c: 'commodities', s: 'bullish', i: 'high' },
      { t: "ECB holds rates steady, warns of persistent inflation", c: 'forex', s: 'bearish', i: 'medium' },
      { t: "Tech stocks rally on better-than-expected earnings reports", c: 'stocks', s: 'bullish', i: 'medium' },
      { t: "Bitcoin reclaims $65k level as ETF inflows accelerate", c: 'crypto', s: 'bullish', i: 'medium' },
      { t: "US Jobless Claims rise unexpectedly to 240k", c: 'economy', s: 'bearish', i: 'high' },
      { t: "China manufacturing PMI contracts for third straight month", c: 'economy', s: 'bearish', i: 'medium' },
      { t: "Goldman Sachs upgrades S&P 500 year-end target", c: 'stocks', s: 'bullish', i: 'medium' },
      { t: "Japanese Yen weakens as BOJ maintains dovish stance", c: 'forex', s: 'bearish', i: 'medium' },
      { t: "Silver breaks out above $30 resistance level", c: 'commodities', s: 'bullish', i: 'medium' },
      { t: "Treasury yields dip following soft inflation data", c: 'economy', s: 'bullish', i: 'high' },
      { t: "NVIDIA announces new AI chip partnership", c: 'stocks', s: 'bullish', i: 'medium' },
      { t: "Eurozone GDP growth stagnates in Q4", c: 'forex', s: 'bearish', i: 'medium' },
      { t: "Crude oil inventories draw larger than expected", c: 'commodities', s: 'bullish', i: 'medium' },
      { t: "Consumer Confidence hits 6-month low", c: 'economy', s: 'bearish', i: 'medium' }
    ];

    const mockNews: NewsItem[] = Array.from({ length: 20 }).map((_, i) => {
      const template = headlines[i % headlines.length];
      return {
        id: `news-${i}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24h
        title: template.t,
        source: sources[Math.floor(Math.random() * sources.length)],
        impact: template.i as any,
        category: template.c as any,
        sentiment: template.s as any,
        summary: "Full story available at source...",
        url: "#",
      };
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return mockNews;
  };

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Simulate network delay
    setTimeout(() => {
      setNews(generateMockNews());
      setLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 60000); // 1 min update
    return () => clearInterval(interval);
  }, [fetchNews]);

  return { news, loading, error, refetch: fetchNews };
}
