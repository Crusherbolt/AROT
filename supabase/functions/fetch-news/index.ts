import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// News sources configuration
const NEWS_SOURCES = {
  finnhub: 'https://finnhub.io/api/v1/news',
  alphavantage: 'https://www.alphavantage.co/query',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category = 'general' } = await req.json().catch(() => ({}));
    
    // Fetch real financial news from multiple free sources
    const newsItems: any[] = [];
    
    // Try Finnhub first (free tier available)
    try {
      const finnhubResponse = await fetch(
        `https://finnhub.io/api/v1/news?category=${category}`,
        {
          headers: { 'X-Finnhub-Token': Deno.env.get('FINNHUB_API_KEY') || '' }
        }
      );
      
      if (finnhubResponse.ok) {
        const finnhubData = await finnhubResponse.json();
        newsItems.push(...(finnhubData || []).slice(0, 20).map((item: any) => ({
          id: item.id?.toString() || Math.random().toString(36),
          title: item.headline,
          source: item.source,
          url: item.url,
          timestamp: new Date(item.datetime * 1000).toISOString(),
          summary: item.summary,
          category: mapCategory(item.category),
          image: item.image,
        })));
      }
    } catch (e) {
      console.log('Finnhub fetch failed:', e);
    }

    // Fallback to RSS feeds via public APIs
    try {
      const rssResponse = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.finance.yahoo.com/rss/2.0/headline'
      );
      
      if (rssResponse.ok) {
        const rssData = await rssResponse.json();
        newsItems.push(...(rssData.items || []).slice(0, 15).map((item: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          title: item.title,
          source: 'Yahoo Finance',
          url: item.link,
          timestamp: new Date(item.pubDate).toISOString(),
          summary: item.description?.replace(/<[^>]*>/g, '').slice(0, 200),
          category: 'economy',
          image: item.enclosure?.link || null,
        })));
      }
    } catch (e) {
      console.log('RSS fetch failed:', e);
    }

    // Add CNBC RSS
    try {
      const cnbcResponse = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=https://www.cnbc.com/id/100003114/device/rss/rss.html'
      );
      
      if (cnbcResponse.ok) {
        const cnbcData = await cnbcResponse.json();
        newsItems.push(...(cnbcData.items || []).slice(0, 10).map((item: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          title: item.title,
          source: 'CNBC',
          url: item.link,
          timestamp: new Date(item.pubDate).toISOString(),
          summary: item.description?.replace(/<[^>]*>/g, '').slice(0, 200),
          category: detectCategory(item.title),
          image: item.thumbnail || null,
        })));
      }
    } catch (e) {
      console.log('CNBC fetch failed:', e);
    }

    // Sort by timestamp and dedupe
    const sortedNews = newsItems
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);

    // Add sentiment analysis based on keywords
    const enrichedNews = sortedNews.map(item => ({
      ...item,
      sentiment: analyzeSentiment(item.title + ' ' + (item.summary || '')),
      impact: analyzeImpact(item.title),
    }));

    return new Response(JSON.stringify({ news: enrichedNews, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching news:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function mapCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'forex': 'forex',
    'crypto': 'crypto',
    'merger': 'stocks',
    'general': 'economy',
    'technology': 'stocks',
  };
  return categoryMap[category?.toLowerCase()] || 'economy';
}

function detectCategory(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('bitcoin') || lower.includes('crypto') || lower.includes('ethereum')) return 'crypto';
  if (lower.includes('dollar') || lower.includes('euro') || lower.includes('forex') || lower.includes('currency')) return 'forex';
  if (lower.includes('oil') || lower.includes('gold') || lower.includes('commodity')) return 'commodities';
  if (lower.includes('stock') || lower.includes('nasdaq') || lower.includes('dow') || lower.includes('s&p')) return 'stocks';
  return 'economy';
}

function analyzeSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const lower = text.toLowerCase();
  const bullishWords = ['surge', 'rally', 'gain', 'rise', 'jump', 'soar', 'bull', 'high', 'record', 'growth', 'beat', 'positive'];
  const bearishWords = ['fall', 'drop', 'decline', 'crash', 'bear', 'low', 'loss', 'down', 'fear', 'concern', 'recession', 'miss'];
  
  const bullishCount = bullishWords.filter(w => lower.includes(w)).length;
  const bearishCount = bearishWords.filter(w => lower.includes(w)).length;
  
  if (bullishCount > bearishCount) return 'bullish';
  if (bearishCount > bullishCount) return 'bearish';
  return 'neutral';
}

function analyzeImpact(title: string): 'high' | 'medium' | 'low' {
  const lower = title.toLowerCase();
  const highImpactWords = ['fed', 'rate', 'inflation', 'gdp', 'employment', 'fomc', 'ecb', 'boj', 'breaking', 'urgent'];
  const mediumImpactWords = ['earnings', 'report', 'data', 'announce', 'expect', 'forecast'];
  
  if (highImpactWords.some(w => lower.includes(w))) return 'high';
  if (mediumImpactWords.some(w => lower.includes(w))) return 'medium';
  return 'low';
}
