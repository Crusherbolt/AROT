import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Alpha Vantage API for ETF data (free tier available)
async function getETFPrice(symbol: string): Promise<{ price: number; change: number; changePercent: number; volume: number } | null> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`
    );
    
    if (response.ok) {
      const data = await response.json();
      const result = data.chart?.result?.[0];
      if (result) {
        const meta = result.meta;
        const quotes = result.indicators?.quote?.[0];
        const price = meta.regularMarketPrice || 0;
        const previousClose = meta.previousClose || price;
        const change = price - previousClose;
        const changePercent = previousClose ? (change / previousClose) * 100 : 0;
        const volume = quotes?.volume?.slice(-1)[0] || meta.regularMarketVolume || 0;
        
        return {
          price: Math.round(price * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          volume,
        };
      }
    }
  } catch (e) {
    console.log(`Error fetching ${symbol}:`, e);
  }
  return null;
}

// Get ETF fund flow data from Yahoo Finance
async function getETFFlowData(symbol: string): Promise<any> {
  try {
    // Get quote summary for AUM and other data
    const response = await fetch(
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=defaultKeyStatistics,summaryDetail,fundProfile`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.quoteSummary?.result?.[0] || null;
    }
  } catch (e) {
    console.log(`Error fetching flow data for ${symbol}:`, e);
  }
  return null;
}

// Get historical data for flow analysis
async function getHistoricalData(symbol: string, range: string = '30d'): Promise<any[]> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`
    );
    
    if (response.ok) {
      const data = await response.json();
      const result = data.chart?.result?.[0];
      if (result) {
        const timestamps = result.timestamp || [];
        const quotes = result.indicators?.quote?.[0] || {};
        
        return timestamps.map((ts: number, i: number) => ({
          date: new Date(ts * 1000).toISOString().split('T')[0],
          open: quotes.open?.[i] || 0,
          high: quotes.high?.[i] || 0,
          low: quotes.low?.[i] || 0,
          close: quotes.close?.[i] || 0,
          volume: quotes.volume?.[i] || 0,
        }));
      }
    }
  } catch (e) {
    console.log(`Error fetching historical data for ${symbol}:`, e);
  }
  return [];
}

// Calculate estimated fund flows from volume and price action
function estimateFlows(historicalData: any[]): { date: string; flow: number; cumulative: number }[] {
  let cumulative = 0;
  return historicalData.map((day, i) => {
    // Estimate flow based on volume and price direction
    const priceChange = i > 0 ? day.close - historicalData[i - 1].close : 0;
    const avgPrice = (day.high + day.low) / 2;
    // Positive price with high volume = inflows, negative = outflows
    const flowDirection = priceChange >= 0 ? 1 : -1;
    const estimatedFlow = (day.volume * avgPrice * flowDirection) / 1000000; // Convert to millions
    cumulative += estimatedFlow;
    
    return {
      date: day.date,
      flow: Math.round(estimatedFlow * 10) / 10,
      cumulative: Math.round(cumulative * 10) / 10,
    };
  });
}

// Major ETFs to track
const TRACKED_ETFS = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', category: 'Equity', sector: 'Large Cap' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', category: 'Equity', sector: 'Tech' },
  { symbol: 'IWM', name: 'iShares Russell 2000', category: 'Equity', sector: 'Small Cap' },
  { symbol: 'DIA', name: 'SPDR Dow Jones', category: 'Equity', sector: 'Large Cap' },
  { symbol: 'XLF', name: 'Financial Select Sector', category: 'Sector', sector: 'Financials' },
  { symbol: 'XLE', name: 'Energy Select Sector', category: 'Sector', sector: 'Energy' },
  { symbol: 'XLK', name: 'Technology Select Sector', category: 'Sector', sector: 'Technology' },
  { symbol: 'XLV', name: 'Health Care Select Sector', category: 'Sector', sector: 'Healthcare' },
  { symbol: 'GLD', name: 'SPDR Gold Shares', category: 'Commodity', sector: 'Precious Metals' },
  { symbol: 'SLV', name: 'iShares Silver Trust', category: 'Commodity', sector: 'Precious Metals' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury', category: 'Bond', sector: 'Treasury' },
  { symbol: 'HYG', name: 'iShares High Yield Corporate', category: 'Bond', sector: 'High Yield' },
  { symbol: 'EEM', name: 'iShares MSCI Emerging Markets', category: 'International', sector: 'Emerging' },
  { symbol: 'EFA', name: 'iShares MSCI EAFE', category: 'International', sector: 'Developed' },
  { symbol: 'VXX', name: 'iPath Series B S&P 500 VIX', category: 'Volatility', sector: 'VIX' },
  { symbol: 'ARKK', name: 'ARK Innovation ETF', category: 'Thematic', sector: 'Innovation' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, type = 'summary' } = await req.json().catch(() => ({}));
    
    console.log(`Fetching ETF flow data - type: ${type}, symbol: ${symbol || 'all'}`);

    if (type === 'detail' && symbol) {
      // Get detailed data for a specific ETF
      const [priceData, flowData, historical] = await Promise.all([
        getETFPrice(symbol),
        getETFFlowData(symbol),
        getHistoricalData(symbol),
      ]);
      
      const etfInfo = TRACKED_ETFS.find(e => e.symbol === symbol);
      const flows = estimateFlows(historical);
      
      const keyStats = flowData?.defaultKeyStatistics || {};
      const summaryDetail = flowData?.summaryDetail || {};
      
      const detail = {
        symbol,
        name: etfInfo?.name || symbol,
        category: etfInfo?.category || 'Unknown',
        sector: etfInfo?.sector || 'Unknown',
        price: priceData?.price || 0,
        change: priceData?.change || 0,
        changePercent: priceData?.changePercent || 0,
        volume: priceData?.volume || 0,
        avgVolume: summaryDetail.averageVolume?.raw || 0,
        aum: keyStats.totalAssets?.raw || 0,
        expenseRatio: keyStats.annualReportExpenseRatio?.raw || 0,
        flows,
        historical: historical.slice(-30),
        lastUpdate: new Date().toISOString(),
      };
      
      return new Response(JSON.stringify({ data: detail, success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get summary for all tracked ETFs
    const etfDataPromises = TRACKED_ETFS.map(async (etf) => {
      const [priceData, historical] = await Promise.all([
        getETFPrice(etf.symbol),
        getHistoricalData(etf.symbol),
      ]);
      
      const flows = estimateFlows(historical);
      const todayFlow = flows.length > 0 ? flows[flows.length - 1].flow : 0;
      const weekFlow = flows.slice(-5).reduce((sum, f) => sum + f.flow, 0);
      
      return {
        ...etf,
        price: priceData?.price || 0,
        change: priceData?.change || 0,
        changePercent: priceData?.changePercent || 0,
        volume: priceData?.volume || 0,
        todayFlow: Math.round(todayFlow * 10) / 10,
        weekFlow: Math.round(weekFlow * 10) / 10,
        monthFlow: flows.length > 0 ? flows[flows.length - 1].cumulative : 0,
        flowTrend: todayFlow > 0 ? 'inflow' : todayFlow < 0 ? 'outflow' : 'neutral',
      };
    });
    
    const etfData = await Promise.all(etfDataPromises);
    
    // Calculate sector aggregates
    const sectorFlows = etfData.reduce((acc, etf) => {
      if (!acc[etf.category]) {
        acc[etf.category] = { totalFlow: 0, count: 0 };
      }
      acc[etf.category].totalFlow += etf.todayFlow;
      acc[etf.category].count += 1;
      return acc;
    }, {} as Record<string, { totalFlow: number; count: number }>);
    
    const summary = {
      etfs: etfData,
      sectorFlows: Object.entries(sectorFlows).map(([category, data]) => ({
        category,
        totalFlow: Math.round(data.totalFlow * 10) / 10,
        avgFlow: Math.round((data.totalFlow / data.count) * 10) / 10,
      })),
      marketSentiment: etfData.filter(e => e.todayFlow > 0).length > etfData.length / 2 ? 'Risk On' : 'Risk Off',
      totalInflows: Math.round(etfData.filter(e => e.todayFlow > 0).reduce((sum, e) => sum + e.todayFlow, 0) * 10) / 10,
      totalOutflows: Math.round(etfData.filter(e => e.todayFlow < 0).reduce((sum, e) => sum + e.todayFlow, 0) * 10) / 10,
      lastUpdate: new Date().toISOString(),
    };
    
    return new Response(JSON.stringify({ data: summary, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching ETF flow data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
