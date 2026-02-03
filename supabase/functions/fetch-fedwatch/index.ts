import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Current Fed Funds Target Rate (updated manually or from external source)
const CURRENT_FED_RATE = 5.50; // 5.25-5.50% range, using upper bound
const RATE_STEP = 0.25; // 25 basis points per cut/hike

// FOMC Meeting dates for 2026
const FOMC_MEETINGS = [
    { date: '2026-01-29', label: 'January 2026' },
    { date: '2026-03-18', label: 'March 2026' },
    { date: '2026-05-06', label: 'May 2026' },
    { date: '2026-06-17', label: 'June 2026' },
    { date: '2026-07-29', label: 'July 2026' },
    { date: '2026-09-16', label: 'September 2026' },
    { date: '2026-11-04', label: 'November 2026' },
    { date: '2026-12-16', label: 'December 2026' },
];

// Get Fed Funds Futures prices from Yahoo Finance
async function getFedFundsFutures(): Promise<Record<string, number>> {
    const futures: Record<string, number> = {};

    // Fed Funds Futures contract symbols (ZQ = 30-day Fed Funds)
    // Format: ZQH26 = March 2026, ZQM26 = June 2026, etc.
    const contracts = [
        { symbol: 'ZQ=F', month: 'near' },  // Front month
        { symbol: 'ZQH26.CBT', month: 'March' },
        { symbol: 'ZQM26.CBT', month: 'June' },
        { symbol: 'ZQU26.CBT', month: 'September' },
        { symbol: 'ZQZ26.CBT', month: 'December' },
    ];

    for (const contract of contracts) {
        try {
            const response = await fetch(
                `https://query1.finance.yahoo.com/v8/finance/chart/${contract.symbol}?interval=1d&range=1d`,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
                if (price) {
                    // Fed Funds futures price: 100 - implied rate
                    // e.g., price of 95.25 implies 4.75% rate
                    futures[contract.month] = 100 - price;
                }
            }
        } catch (e) {
            console.log(`Error fetching ${contract.symbol}:`, e);
        }
    }

    return futures;
}

// Calculate probabilities based on current rate and implied future rate
function calculateProbabilities(currentRate: number, impliedRate: number): {
    probabilityCut: number;
    probabilityHold: number;
    probabilityHike: number;
    impliedRate: number;
    expectedCuts: number;
} {
    const rateDiff = currentRate - impliedRate;
    const cutsImplied = rateDiff / RATE_STEP;

    // If implied rate is lower than current = market expects cuts
    // If implied rate is higher than current = market expects hikes

    let probabilityCut = 0;
    let probabilityHold = 0;
    let probabilityHike = 0;

    if (rateDiff > 0) {
        // Market expects rate cuts
        const fullCuts = Math.floor(cutsImplied);
        const partialCut = cutsImplied - fullCuts;

        // Probability of at least one cut
        probabilityCut = Math.min(100, cutsImplied * 100);
        probabilityHold = Math.max(0, 100 - probabilityCut);
        probabilityHike = 0;
    } else if (rateDiff < 0) {
        // Market expects rate hikes
        const hikesImplied = -cutsImplied;
        probabilityHike = Math.min(100, hikesImplied * 100);
        probabilityHold = Math.max(0, 100 - probabilityHike);
        probabilityCut = 0;
    } else {
        // No change expected
        probabilityHold = 100;
    }

    return {
        probabilityCut: Math.round(probabilityCut * 10) / 10,
        probabilityHold: Math.round(probabilityHold * 10) / 10,
        probabilityHike: Math.round(probabilityHike * 10) / 10,
        impliedRate: Math.round(impliedRate * 100) / 100,
        expectedCuts: Math.round(cutsImplied * 10) / 10,
    };
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Fetch Fed Funds Futures data
        const futures = await getFedFundsFutures();

        // Get the next upcoming meeting
        const today = new Date().toISOString().split('T')[0];
        const nextMeeting = FOMC_MEETINGS.find(m => m.date > today) || FOMC_MEETINGS[0];

        // Use the implied rate from futures, or estimate based on market
        // Typically, the March future price gives us the implied rate for March
        const impliedRate = futures['March'] || futures['near'] || (CURRENT_FED_RATE - 0.35);

        const probabilities = calculateProbabilities(CURRENT_FED_RATE, impliedRate);

        // Build meeting-by-meeting probabilities
        const meetingProbabilities = FOMC_MEETINGS
            .filter(m => m.date > today)
            .slice(0, 6)
            .map((meeting, index) => {
                // Each future meeting has progressively more cuts priced in
                const monthsAhead = index + 1;
                const cumulativeCuts = probabilities.expectedCuts * (monthsAhead / 6);
                const meetingImpliedRate = CURRENT_FED_RATE - (cumulativeCuts * RATE_STEP);
                const meetingProbs = calculateProbabilities(CURRENT_FED_RATE, meetingImpliedRate);

                return {
                    date: meeting.date,
                    label: meeting.label,
                    ...meetingProbs,
                };
            });

        const fedWatchData = {
            currentRate: `${CURRENT_FED_RATE - 0.25}-${CURRENT_FED_RATE}`,
            currentRateValue: CURRENT_FED_RATE,
            nextMeeting: nextMeeting,
            targetRate: `${(impliedRate - 0.25).toFixed(2)}-${impliedRate.toFixed(2)}`,
            ...probabilities,
            meetings: meetingProbabilities,
            futuresData: futures,
            lastUpdate: new Date().toISOString(),
            source: 'Fed Funds Futures (CME)',
        };

        return new Response(JSON.stringify({ data: fedWatchData, success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error: unknown) {
        console.error('Error fetching FedWatch data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: errorMessage, success: false }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
