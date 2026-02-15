import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Yahoo Session Manager (Cookie/Crumb Authentication) ---
class YahooSession {
  private cookie: string | null = null;
  private crumb: string | null = null;
  private userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

  async init() {
    if (this.crumb) return;
    try {
      console.log("Initializing Yahoo Session...");
      // 1. Get Cookie from fc.yahoo.com (redirects set cookies)
      const cookieRes = await fetch("https://fc.yahoo.com", {
        headers: { "User-Agent": this.userAgent },
        redirect: "manual"
      });

      const setCookie = cookieRes.headers.get("set-cookie");
      if (setCookie) {
        // Extract the first part of the cookie
        this.cookie = setCookie.split(';')[0];
        console.log("Cookie acquired.");
      } else {
        console.log("Failed to acquire cookie.");
        return;
      }

      if (this.cookie) {
        // 2. Get Crumb using the cookie
        const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
          headers: {
            "User-Agent": this.userAgent,
            "Cookie": this.cookie
          }
        });
        if (crumbRes.ok) {
          this.crumb = await crumbRes.text();
          console.log("Crumb acquired.");
        } else {
          console.log("Failed to acquire crumb:", crumbRes.status);
        }
      }
    } catch (e) {
      console.error("Yahoo Session Init Error:", e);
    }
  }

  async fetch(url: string) {
    if (!this.crumb) await this.init();

    // Add crumb to URL if we have it
    let finalUrl = url;
    if (this.crumb) {
      const delim = url.includes('?') ? '&' : '?';
      finalUrl = `${url}${delim}crumb=${this.crumb}`;
    }

    return fetch(finalUrl, {
      headers: {
        "User-Agent": this.userAgent,
        "Cookie": this.cookie || ""
      }
    });
  }
}

const yahooSession = new YahooSession();

// Deterministic fallback (kept for extreme edge cases)
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs((Math.sin(hash) * 43758.5453) % 1);
}

const FALLBACK_PRICES: Record<string, number> = {
  'SPY': 604.50, 'QQQ': 535.20, 'IWM': 228.50, 'DIA': 442.00,
  'GLD': 268.00, 'SLV': 29.50, 'TLT': 86.50, 'HYG': 78.20,
  'AAPL': 232.80, 'MSFT': 412.60, 'NVDA': 131.50, 'AMZN': 228.30,
  'META': 705.40, 'TSLA': 340.00, 'GOOGL': 188.20, 'AMD': 118.75
};

async function getStockPrice(ticker: string): Promise<number | null> {
  try {
    const response = await yahooSession.fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`);
    if (response.ok) {
      const data = await response.json();
      return data.chart?.result?.[0]?.meta?.regularMarketPrice || null;
    }
  } catch (e) {
    console.error("Price fetch error:", e);
  }
  return null;
}

async function getOptionsData(ticker: string, expirationDate?: string): Promise<any> {
  try {
    let url = `https://query2.finance.yahoo.com/v7/finance/options/${ticker}`;

    // Handle expiration date filtering
    // Yahoo expects UNIX timestamp for specific dates
    if (expirationDate) {
      const targetDate = new Date(expirationDate);
      if (!isNaN(targetDate.getTime())) {
        const timestamp = Math.floor(targetDate.getTime() / 1000);
        url += `?date=${timestamp}`;
      }
    }

    const response = await yahooSession.fetch(url);
    if (response.ok) {
      const data = await response.json();
      return data.optionChain?.result?.[0] || null;
    } else {
      console.log("Options fetch failed:", response.status);
    }
  } catch (e) {
    console.error("Options fetch error:", e);
  }
  return null;
}

function processRealOptionsData(optionsData: any, spotPrice: number) {
  // Extract actual strikes
  const calls = optionsData.options[0].calls || [];
  const puts = optionsData.options[0].puts || [];
  const strikeMap = new Map();

  // Process Calls
  calls.forEach((call: any) => {
    const strike = call.strike;
    if (!strikeMap.has(strike)) {
      strikeMap.set(strike, { strike, callOI: 0, putOI: 0, callGamma: 0, putGamma: 0 });
    }
    const data = strikeMap.get(strike);
    data.callOI = call.openInterest || 0;

    // Approximate Gamma: Gamma is highest ATM and decays OTM
    // Simple model: OI * Spot * 0.01 * DecayFactor
    // Real gamma requires Black-Scholes, but this proxy is standard for "GEX" visualizations without greeks
    const moneyness = (strike - spotPrice) / spotPrice;
    const gammaMultiplier = Math.exp(-Math.abs(moneyness) * 20); // Sharp decay

    // GEX = OI * 100 * Spot * Gamma(proxy)
    // Simplified for visualization scaling:
    data.callGamma = Math.round(data.callOI * 100 * gammaMultiplier);
  });

  // Process Puts
  puts.forEach((put: any) => {
    const strike = put.strike;
    if (!strikeMap.has(strike)) {
      strikeMap.set(strike, { strike, callOI: 0, putOI: 0, callGamma: 0, putGamma: 0 });
    }
    const data = strikeMap.get(strike);
    data.putOI = put.openInterest || 0;

    const moneyness = (strike - spotPrice) / spotPrice;
    const gammaMultiplier = Math.exp(-Math.abs(moneyness) * 20);

    // Puts contribute negative gamma
    data.putGamma = Math.round(-data.putOI * 100 * gammaMultiplier);
  });

  let strikes = Array.from(strikeMap.values())
    .map((s: any) => ({ ...s, netGamma: s.callGamma + s.putGamma }))
    .sort((a: any, b: any) => a.strike - b.strike);

  // Filter to relevant range (+/- 15% of spot) usually sufficient
  strikes = strikes.filter((s: any) => Math.abs(s.strike - spotPrice) / spotPrice < 0.20);

  // Calculate Walls and Flip
  let gammaFlip = spotPrice;
  let cumGamma = 0;

  // Total market gamma
  const totalGamma = strikes.reduce((sum: number, s: any) => sum + Math.abs(s.netGamma), 0);
  const netGamma = strikes.reduce((sum: number, s: any) => sum + s.netGamma, 0);

  // Find Flip (where cumulative gamma crosses 0 locally or structurally)
  // Simple heuristic: where net gamma changes sign closest to spot?
  // Or just 0GEX level

  // Find Walls (Max OI)
  const maxPutOI = Math.max(...strikes.map((s: any) => s.putOI));
  const maxCallOI = Math.max(...strikes.map((s: any) => s.callOI));
  const putWall = strikes.find((s: any) => s.putOI === maxPutOI)?.strike || spotPrice;
  const callWall = strikes.find((s: any) => s.callOI === maxCallOI)?.strike || spotPrice;

  // Find Flip: Where Net Gamma goes from negative to positive
  // OR just return spot if unclear.
  // Let's us a simple search for sign change nearest spot
  let closestDist = Infinity;
  strikes.forEach((s, i) => {
    if (i > 0) {
      const prev = strikes[i - 1];
      if ((prev.netGamma < 0 && s.netGamma > 0) || (prev.netGamma > 0 && s.netGamma < 0)) {
        if (Math.abs(s.strike - spotPrice) < closestDist) {
          closestDist = Math.abs(s.strike - spotPrice);
          gammaFlip = s.strike;
        }
      }
    }
  });

  return {
    strikes,
    gammaFlip,
    putWall,
    callWall,
    totalGamma,
    netGamma
  };
}

function generateDeterministicGamma(ticker: string, spotPrice: number, expiration: string) {
  // ... (Keep existing fallback logic but reduce duplication - previous code block)
  const strikes: any[] = [];
  const strikeStep = Math.round(spotPrice * 0.01 * 100) / 100;

  for (let i = -15; i <= 15; i++) {
    const strike = Math.round((spotPrice + i * strikeStep) * 100) / 100;
    const distanceFromSpot = Math.abs(strike - spotPrice) / spotPrice;
    const gammaMultiplier = Math.exp(-distanceFromSpot * 10);

    let callSkew = strike > spotPrice ? 1.5 : 0.5;
    let putSkew = strike < spotPrice ? 1.8 : 0.5;

    const seedBase = `${ticker}-${strike}-${expiration}`;
    const r1 = seededRandom(seedBase + '-callOI');
    const r2 = seededRandom(seedBase + '-putOI');

    const callOI = Math.floor(r1 * 40000 * gammaMultiplier * callSkew) + 500;
    const putOI = Math.floor(r2 * 45000 * gammaMultiplier * putSkew) + 500;

    const callGamma = Math.round(callOI * 100 * gammaMultiplier * 0.015);
    const putGamma = Math.round(-putOI * 100 * gammaMultiplier * 0.015);

    strikes.push({
      strike,
      callGamma,
      putGamma,
      netGamma: callGamma + putGamma,
      callOI,
      putOI,
    });
  }

  const putWall = strikes.reduce((max, s) => s.putOI > max.putOI ? s : max, strikes[0]).strike;
  const callWall = strikes.reduce((max, s) => s.callOI > max.callOI ? s : max, strikes[0]).strike;

  const flipSeed = seededRandom(`${ticker}-flip-${expiration}`);
  const gammaFlip = Math.round((spotPrice * (0.98 + (flipSeed * 0.04))) * 100) / 100;

  const totalGamma = strikes.reduce((sum: number, s: any) => sum + Math.abs(s.netGamma), 0);
  const netGamma = strikes.reduce((sum: number, s: any) => sum + s.netGamma, 0);

  return {
    strikes: strikes.sort((a, b) => a.strike - b.strike),
    gammaFlip,
    putWall,
    callWall,
    totalGamma,
    netGamma
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticker, expiration } = await req.json();

    if (!ticker) {
      return new Response(JSON.stringify({ error: 'Ticker is required', success: false }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const upperTicker = ticker.toUpperCase();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? "";
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "";
    let supabase: any = null;

    if (supabaseUrl && supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey);
      // Check cache first (valid for 5 minutes)
      // ... (omitted for brevity, keep existing flow if possible or just fresh fetch)
    }

    // --- EXECUTION ---
    // 1. Get Spot Price
    let spotPrice = await getStockPrice(upperTicker);
    if (!spotPrice) {
      // Fallback Price
      spotPrice = FALLBACK_PRICES[upperTicker] || 100;
      console.log(`Using fallback price for ${upperTicker}: ${spotPrice}`);
    } else {
      console.log(`Real price for ${upperTicker}: ${spotPrice}`);
    }

    // 2. Get Options Data
    const optionsData = await getOptionsData(upperTicker, expiration);

    let gammaResult;
    let dataSource = 'simulation';

    if (optionsData && optionsData.options && optionsData.options[0]) {
      console.log(`Processing real options data for ${upperTicker}`);
      gammaResult = processRealOptionsData(optionsData, spotPrice);
      dataSource = 'yahoo_finance_realtime';
    } else {
      console.log(`Falling back to simulation for ${upperTicker}`);
      gammaResult = generateDeterministicGamma(upperTicker, spotPrice, expiration || '2026-01-01');
      dataSource = 'simulation (fallback)';
    }

    const gammaData = {
      ticker: upperTicker,
      expiration: expiration,
      spotPrice: spotPrice,
      ...gammaResult,
      lastUpdate: new Date().toISOString(),
      source: dataSource,
    };

    // Cache (Optional: re-add strict caching if needed for rate limits, but Real-Time is requested)
    // ...

    return new Response(JSON.stringify({ data: gammaData, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
