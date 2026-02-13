import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Deterministic hash function — same ticker+strike always produces same "random" value
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Normalize to 0-1 range
  return Math.abs((Math.sin(hash) * 43758.5453) % 1);
}

// Updated Feb 2026 fallback prices
const FALLBACK_PRICES: Record<string, number> = {
  'SPY': 604.50,
  'QQQ': 535.20,
  'AAPL': 232.80,
  'TSLA': 340.00,
  'NVDA': 131.50,
  'AMZN': 228.30,
  'MSFT': 412.60,
  'META': 705.40,
  'GOOGL': 188.20,
  'GOOG': 189.50,
  'AMD': 118.75,
  'IWM': 228.50,
  'DIA': 442.00,
  'GLD': 268.00,
  'SLV': 29.50,
  'TLT': 86.50,
  'XLE': 88.20,
  'XLF': 48.50,
  'AVGO': 235.80,
  'CRM': 345.20,
  'COIN': 285.00,
  'MSTR': 330.00,
  'NFLX': 980.00,
  'JPM': 262.50,
  'BAC': 47.20,
  'WFC': 75.30,
  'GS': 620.00,
  'V': 342.00,
  'MA': 545.00,
  'WMT': 98.50,
  'COST': 1005.00,
  'HD': 405.00,
  'NKE': 72.50,
  'XOM': 108.50,
  'CVX': 155.00,
  'LLY': 845.00,
  'JNJ': 158.00,
  'PFE': 26.50,
  'BA': 178.50,
  'CAT': 385.00,
  'DIS': 112.00,
  'INTC': 22.50,
  'PLTR': 115.00,
  'SMCI': 42.00,
  'MU': 98.50,
};

// Try to get live price from Yahoo Finance (best effort)
async function getStockPrice(ticker: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
      { signal: AbortSignal.timeout(3000) } // 3 second timeout
    );
    if (response.ok) {
      const data = await response.json();
      const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
      return price || null;
    }
  } catch (_e) {
    // Yahoo Finance often blocks server-side calls — expected
  }
  return null;
}

// Try to get real options data from Yahoo Finance (best effort)
async function getOptionsData(ticker: string): Promise<any> {
  try {
    const response = await fetch(
      `https://query2.finance.yahoo.com/v7/finance/options/${ticker}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (response.ok) {
      const data = await response.json();
      return data.optionChain?.result?.[0] || null;
    }
  } catch (_e) {
    // Expected to fail from server-side
  }
  return null;
}

function getNextFriday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  const nextFriday = new Date(today.getTime() + daysUntilFriday * 24 * 60 * 60 * 1000);
  return nextFriday.toISOString().split('T')[0];
}

// Generate deterministic gamma data based on ticker + spot price
function generateDeterministicGamma(ticker: string, spotPrice: number, expiration: string) {
  const strikes: any[] = [];
  const strikeStep = Math.round(spotPrice * 0.01 * 100) / 100; // 1% step

  for (let i = -10; i <= 10; i++) {
    const strike = Math.round((spotPrice + i * strikeStep) * 100) / 100;
    const distanceFromSpot = Math.abs(strike - spotPrice) / spotPrice;
    const gammaMultiplier = Math.exp(-distanceFromSpot * 8);

    // Use deterministic seeded random instead of Math.random()
    const seedBase = `${ticker}-${strike}-${expiration}`;
    const r1 = seededRandom(seedBase + '-callOI');
    const r2 = seededRandom(seedBase + '-putOI');

    const callOI = Math.floor(r1 * 50000 * gammaMultiplier) + 1000;
    const putOI = Math.floor(r2 * 50000 * gammaMultiplier) + 1000;
    const callGamma = Math.round(callOI * 100 * gammaMultiplier * 0.01);
    const putGamma = Math.round(-putOI * 100 * gammaMultiplier * 0.01);

    strikes.push({
      strike,
      callGamma,
      putGamma,
      netGamma: callGamma + putGamma,
      callOI,
      putOI,
    });
  }

  // Find walls deterministically (highest OI)
  const maxPutOI = Math.max(...strikes.map((s: any) => s.putOI));
  const maxCallOI = Math.max(...strikes.map((s: any) => s.callOI));
  const putWall = strikes.find((s: any) => s.putOI === maxPutOI)?.strike || spotPrice * 0.95;
  const callWall = strikes.find((s: any) => s.callOI === maxCallOI)?.strike || spotPrice * 1.05;

  // Calculate gamma flip deterministically
  const flipSeed = seededRandom(`${ticker}-flip-${expiration}`);
  const gammaFlip = Math.round((spotPrice * (1 + (flipSeed - 0.5) * 0.02)) * 100) / 100;

  const totalGamma = strikes.reduce((sum: number, s: any) => sum + Math.abs(s.netGamma), 0);
  const netGamma = strikes.reduce((sum: number, s: any) => sum + s.netGamma, 0);

  return {
    strikes,
    gammaFlip,
    putWall: Math.round(putWall * 100) / 100,
    callWall: Math.round(callWall * 100) / 100,
    totalGamma: Math.round(totalGamma),
    netGamma: Math.round(netGamma),
  };
}

// Process real options chain data from Yahoo Finance
function processRealOptionsData(optionsData: any, spotPrice: number) {
  const calls = optionsData.options[0].calls || [];
  const puts = optionsData.options[0].puts || [];
  const strikeMap = new Map();

  calls.forEach((call: any) => {
    const strike = call.strike;
    if (!strikeMap.has(strike)) {
      strikeMap.set(strike, { strike, callOI: 0, putOI: 0, callGamma: 0, putGamma: 0 });
    }
    const data = strikeMap.get(strike);
    data.callOI = call.openInterest || 0;
    const moneyness = (strike - spotPrice) / spotPrice;
    const gammaMultiplier = Math.exp(-Math.abs(moneyness) * 5);
    data.callGamma = Math.round(data.callOI * 100 * gammaMultiplier * 0.01);
  });

  puts.forEach((put: any) => {
    const strike = put.strike;
    if (!strikeMap.has(strike)) {
      strikeMap.set(strike, { strike, callOI: 0, putOI: 0, callGamma: 0, putGamma: 0 });
    }
    const data = strikeMap.get(strike);
    data.putOI = put.openInterest || 0;
    const moneyness = (strike - spotPrice) / spotPrice;
    const gammaMultiplier = Math.exp(-Math.abs(moneyness) * 5);
    data.putGamma = Math.round(-data.putOI * 100 * gammaMultiplier * 0.01);
  });

  const strikes = Array.from(strikeMap.values())
    .map((s: any) => ({ ...s, netGamma: s.callGamma + s.putGamma }))
    .sort((a: any, b: any) => a.strike - b.strike)
    .filter((s: any) => Math.abs(s.strike - spotPrice) / spotPrice < 0.15)
    .slice(0, 21);

  // Find gamma flip
  let gammaFlip = spotPrice;
  let cumGamma = 0;
  for (const s of strikes) {
    cumGamma += s.netGamma;
    if (cumGamma >= 0 && s.strike >= spotPrice) {
      gammaFlip = s.strike;
      break;
    }
  }

  // Find walls
  const maxPutOI = Math.max(...strikes.map((s: any) => s.putOI));
  const maxCallOI = Math.max(...strikes.map((s: any) => s.callOI));
  const putWall = strikes.find((s: any) => s.putOI === maxPutOI)?.strike || spotPrice * 0.95;
  const callWall = strikes.find((s: any) => s.callOI === maxCallOI)?.strike || spotPrice * 1.05;

  const totalGamma = strikes.reduce((sum: number, s: any) => sum + Math.abs(s.netGamma), 0);
  const netGamma = strikes.reduce((sum: number, s: any) => sum + s.netGamma, 0);

  return {
    strikes,
    gammaFlip: Math.round(gammaFlip * 100) / 100,
    putWall: Math.round(putWall * 100) / 100,
    callWall: Math.round(callWall * 100) / 100,
    totalGamma: Math.round(totalGamma),
    netGamma: Math.round(netGamma),
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
    const exp = expiration || getNextFriday();

    // Initialize Supabase client for caching
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? "";
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "";
    let supabase: any = null;

    if (supabaseUrl && supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey);

      // Check cache first (valid for 5 minutes)
      try {
        const { data: cached } = await supabase
          .from('gamma_cache')
          .select('*')
          .eq('ticker', upperTicker)
          .eq('expiration', exp)
          .order('created_at', { ascending: false })
          .limit(1);

        if (cached && cached.length > 0) {
          const age = new Date().getTime() - new Date(cached[0].created_at).getTime();
          if (age < 300000) { // 5 minutes
            console.log(`Returning cached gamma data for ${upperTicker} (age: ${Math.round(age / 1000)}s)`);
            return new Response(JSON.stringify({ data: JSON.parse(cached[0].data), success: true, source: 'cache' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (cacheErr) {
        console.log('Cache check failed (table may not exist yet):', cacheErr);
      }
    }

    // Try live price first, fallback to known prices
    let spotPrice = await getStockPrice(upperTicker);
    if (!spotPrice) {
      spotPrice = FALLBACK_PRICES[upperTicker] || 100 + seededRandom(upperTicker) * 400;
    }

    // Try real options data first
    const optionsData = await getOptionsData(upperTicker);

    let gammaResult;
    let dataSource = 'simulation';

    if (optionsData?.options?.[0]) {
      gammaResult = processRealOptionsData(optionsData, spotPrice);
      dataSource = 'yahoo_finance';
    } else {
      gammaResult = generateDeterministicGamma(upperTicker, spotPrice, exp);
      dataSource = 'deterministic_model';
    }

    const gammaData = {
      ticker: upperTicker,
      expiration: exp,
      spotPrice: Math.round(spotPrice * 100) / 100,
      gammaFlip: gammaResult.gammaFlip,
      putWall: gammaResult.putWall,
      callWall: gammaResult.callWall,
      totalGamma: gammaResult.totalGamma,
      netGamma: gammaResult.netGamma,
      gammaNotional: Math.round(gammaResult.totalGamma * spotPrice * 100),
      deltaAdjustedGamma: Math.round(gammaResult.netGamma * 0.5),
      strikes: gammaResult.strikes,
      lastUpdate: new Date().toISOString(),
      source: dataSource,
    };

    // Cache the result in Supabase
    if (supabase) {
      try {
        await supabase.from('gamma_cache').upsert({
          ticker: upperTicker,
          expiration: exp,
          data: JSON.stringify(gammaData),
          created_at: new Date().toISOString(),
        }, { onConflict: 'ticker,expiration' });
      } catch (persistErr) {
        console.log('Cache persist failed:', persistErr);
      }
    }

    return new Response(JSON.stringify({ data: gammaData, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching gamma data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
