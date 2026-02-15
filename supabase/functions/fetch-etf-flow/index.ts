import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Yahoo Session Manager (Shared Logic) ---
class YahooSession {
  private cookie: string | null = null;
  private crumb: string | null = null;
  private userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

  async init() {
    if (this.crumb) return;
    try {
      const cookieRes = await fetch("https://fc.yahoo.com", {
        headers: { "User-Agent": this.userAgent },
        redirect: "manual"
      });
      const setCookie = cookieRes.headers.get("set-cookie");
      if (setCookie) this.cookie = setCookie.split(';')[0];

      if (this.cookie) {
        const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
          headers: { "User-Agent": this.userAgent, "Cookie": this.cookie }
        });
        if (crumbRes.ok) this.crumb = await crumbRes.text();
      }
    } catch (e) {
      console.error("Session Init Error:", e);
    }
  }

  async fetch(url: string) {
    if (!this.crumb) await this.init();
    let finalUrl = url;
    if (this.crumb) {
      const delim = url.includes('?') ? '&' : '?';
      finalUrl = `${url}${delim}crumb=${this.crumb}`;
    }
    return fetch(finalUrl, {
      headers: { "User-Agent": this.userAgent, "Cookie": this.cookie || "" }
    });
  }
}
const yahooSession = new YahooSession();

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { ticker } = await req.json();
    if (!ticker) throw new Error("Ticker required");

    const upperTicker = ticker.toUpperCase();

    // Fetch 1 Month of Daily Data
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${upperTicker}?range=1mo&interval=1d`;
    const res = await yahooSession.fetch(url);

    if (!res.ok) throw new Error("Failed to fetch chart data");

    const data = await res.json();
    const result = data.chart?.result?.[0];

    if (!result) throw new Error("No data found");

    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    const adjClose = result.indicators.adjclose?.[0]?.adjclose || quotes.close;

    // Calculate Estimated Flows
    const history = timestamps.map((ts: number, i: number) => {
      const close = quotes.close[i];
      const open = quotes.open[i];
      const volume = quotes.volume[i];

      if (!close || !volume) return null;

      // "Money Flow" Approximation
      // Classic Money Flow: ((Close - Low) - (High - Close)) / (High - Low) * Volume
      // Simplified ETF Flow: Net $ = Volume * (Close - Open)
      // This estimates the net buying/selling pressure in dollar terms.
      const netFlow = volume * (close - open);

      // Split into "Inflow" vs "Outflow" proxy
      // If Green Day: Inflow = Volume * Close, Outflow = 0 (Simplified)
      // A smarter way: 
      // Inflow = Volume * Close * (Buying % approx)
      // Let's keep it simple: Net Flow is the key metric.

      return {
        date: new Date(ts * 1000).toISOString().split('T')[0],
        netFlow: Math.round(netFlow / 1000000), // In Millions
        inflow: close > open ? Math.round((volume * close) / 1000000) : 0,
        outflow: close < open ? Math.round((volume * close) / 1000000) : 0,
        volume: volume,
        close: close
      };
    }).filter((x: any) => x !== null);

    // Cumulative Flow
    let cumulative = 0;
    const historyWithCumulative = history.map((h: any) => {
      cumulative += h.netFlow;
      return { ...h, cumulativeFlow: cumulative };
    });

    // Summary Metrics
    const last = historyWithCumulative[historyWithCumulative.length - 1];
    const avgFlow = historyWithCumulative.reduce((sum: number, h: any) => sum + h.netFlow, 0) / historyWithCumulative.length;

    // Determine Trend
    let trend = 'neutral';
    if (avgFlow > 50) trend = 'bullish';
    if (avgFlow < -50) trend = 'bearish';

    const responsePayload = {
      ticker: upperTicker,
      date: last.date,
      netFlow: last.netFlow,
      inflow: last.inflow,
      outflow: last.outflow,
      volume: last.volume,
      aum: 0, // AUM not in simple chart data, user can accept 0 or we estimate
      flowTrend: trend,
      history: historyWithCumulative
    };

    return new Response(JSON.stringify({ data: responsePayload, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
