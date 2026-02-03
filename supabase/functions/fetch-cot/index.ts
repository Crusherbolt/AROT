import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CFTC COT Report data endpoints
const CFTC_LEGACY_API = 'https://publicreporting.cftc.gov/resource/jun7-fc8e.json';
const CFTC_DISAGGREGATED_API = 'https://publicreporting.cftc.gov/resource/72hh-3qpy.json';
const CFTC_TFF_API = 'https://publicreporting.cftc.gov/resource/gpe5-46if.json';

// Contract code mapping for common instruments
const CONTRACT_MAPPING: Record<string, { name: string; category: string; code: string }> = {
  '099741': { name: 'EUR/USD', category: 'forex', code: 'EURUSD' },
  '096742': { name: 'GBP/USD', category: 'forex', code: 'GBPUSD' },
  '097741': { name: 'JPY/USD', category: 'forex', code: 'JPYUSD' },
  '232741': { name: 'AUD/USD', category: 'forex', code: 'AUDUSD' },
  '090741': { name: 'CAD/USD', category: 'forex', code: 'CADUSD' },
  '092741': { name: 'CHF/USD', category: 'forex', code: 'CHFUSD' },
  '088691': { name: 'Gold', category: 'commodities', code: 'GOLD' },
  '084691': { name: 'Silver', category: 'commodities', code: 'SILVER' },
  '067651': { name: 'Crude Oil', category: 'commodities', code: 'CL' },
  '023651': { name: 'Natural Gas', category: 'commodities', code: 'NG' },
  '085692': { name: 'Copper', category: 'commodities', code: 'HG' },
  '001612': { name: 'Wheat', category: 'commodities', code: 'WHEAT' },
  '002602': { name: 'Corn', category: 'commodities', code: 'CORN' },
  '005602': { name: 'Soybeans', category: 'commodities', code: 'SOYBEANS' },
  '13874A': { name: 'S&P 500', category: 'indices', code: 'SPX' },
  '209742': { name: 'Nasdaq 100', category: 'indices', code: 'NDX' },
  '124603': { name: 'Dow Jones', category: 'indices', code: 'DJI' },
  '043602': { name: '10Y Treasury', category: 'bonds', code: '10Y' },
  '020601': { name: '30Y Treasury', category: 'bonds', code: '30Y' },
};

interface COTRecord {
  date: string;
  commodity: string;
  code: string;
  category: string;
  commercialLong: number;
  commercialShort: number;
  commercialNet: number;
  nonCommercialLong: number;
  nonCommercialShort: number;
  nonCommercialNet: number;
  nonReportableLong: number;
  nonReportableShort: number;
  nonReportableNet: number;
  openInterest: number;
  changeLong: number;
  changeShort: number;
  changeNet: number;
  changeOI: number;
  percentOILong: number;
  percentOIShort: number;
  spreadPositions: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const commodity = url.searchParams.get('commodity');
    const weeks = parseInt(url.searchParams.get('weeks') || '25');

    console.log(`Fetching COT data - commodity: ${commodity}, weeks: ${weeks}`);

    let cotData: COTRecord[] = [];
    let historicalData: Record<string, COTRecord[]> = {};

    // Fetch from CFTC Legacy Futures API
    try {
      const response = await fetch(
        `${CFTC_LEGACY_API}?$limit=500&$order=report_date_as_yyyy_mm_dd DESC`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`CFTC API returned ${data.length} records`);

        // Process and map the data
        const processedData = data
          .filter((item: any) => CONTRACT_MAPPING[item.cftc_contract_market_code])
          .map((item: any) => {
            const mapping = CONTRACT_MAPPING[item.cftc_contract_market_code];
            const commLong = parseInt(item.comm_positions_long_all) || 0;
            const commShort = parseInt(item.comm_positions_short_all) || 0;
            const nonCommLong = parseInt(item.noncomm_positions_long_all) || 0;
            const nonCommShort = parseInt(item.noncomm_positions_short_all) || 0;
            const nonRepLong = parseInt(item.nonrept_positions_long_all) || 0;
            const nonRepShort = parseInt(item.nonrept_positions_short_all) || 0;
            const oi = parseInt(item.open_interest_all) || 1;
            const spread = parseInt(item.noncomm_positions_spread_all) || 0;

            return {
              date: item.report_date_as_yyyy_mm_dd,
              commodity: mapping.name,
              code: mapping.code,
              category: mapping.category,
              commercialLong: commLong,
              commercialShort: commShort,
              commercialNet: commLong - commShort,
              nonCommercialLong: nonCommLong,
              nonCommercialShort: nonCommShort,
              nonCommercialNet: nonCommLong - nonCommShort,
              nonReportableLong: nonRepLong,
              nonReportableShort: nonRepShort,
              nonReportableNet: nonRepLong - nonRepShort,
              openInterest: oi,
              changeLong: parseInt(item.change_in_comm_long_all) || 0,
              changeShort: parseInt(item.change_in_comm_short_all) || 0,
              changeNet: 0,
              changeOI: parseInt(item.change_in_open_interest_all) || 0,
              percentOILong: Math.round((commLong / oi) * 1000) / 10,
              percentOIShort: Math.round((commShort / oi) * 1000) / 10,
              spreadPositions: spread,
            };
          });

        // Group by commodity and sort by date
        processedData.forEach((record: COTRecord) => {
          if (!historicalData[record.code]) {
            historicalData[record.code] = [];
          }
          historicalData[record.code].push(record);
        });

        // Sort each commodity's data by date descending
        Object.keys(historicalData).forEach(code => {
          historicalData[code].sort((a, b) => b.date.localeCompare(a.date));
          // Limit to requested weeks
          historicalData[code] = historicalData[code].slice(0, weeks);
        });

        // Calculate week-over-week changes
        Object.keys(historicalData).forEach(code => {
          const records = historicalData[code];
          for (let i = 0; i < records.length - 1; i++) {
            const curr = records[i];
            const prev = records[i + 1];
            curr.changeLong = curr.commercialLong - prev.commercialLong;
            curr.changeShort = curr.commercialShort - prev.commercialShort;
            curr.changeNet = curr.commercialNet - prev.commercialNet;
          }
        });

        // Get latest data per commodity for summary
        Object.keys(historicalData).forEach(code => {
          if (historicalData[code].length > 0) {
            cotData.push(historicalData[code][0]);
          }
        });
      }
    } catch (e) {
      console.log('CFTC API error:', e);
    }

    // If no data from API, return error instead of sample data
    if (cotData.length === 0) {
      throw new Error('No data returned from CFTC API');
    }

    // If a specific commodity is requested, return its historical data
    if (commodity) {
      const commodityKey = commodity.toUpperCase();
      const history = historicalData[commodityKey] || [];

      return new Response(JSON.stringify({
        data: history,
        summary: cotData.find(d => d.code === commodityKey),
        success: true,
        lastUpdate: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      data: cotData,
      historical: historicalData,
      success: true,
      lastUpdate: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching COT data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
