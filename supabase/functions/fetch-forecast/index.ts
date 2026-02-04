
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// User-provided Ground Truth for core assets
const GROUND_TRUTH: Record<string, any> = {
    'GOLD': {
        summary: "Gold enters a secular bull market as central banks diversify and inflation hedges remain critical. Institutional consensus points to massive upside through 2026.",
        targets: [
            { institution: 'Goldman Sachs', target: '$5,400', view: 'Bullish', date: 'Dec 2025' },
            { institution: 'UBS', target: '$6,000', view: 'Bullish', date: 'Jan 2026' },
            { institution: 'J.P. Morgan', target: '$5,250', view: 'Bullish', date: 'Q4 2025' }
        ],
        risks: ['Real yield spikes', 'Stronger USD persistence']
    },
    'SILVER': {
        summary: "Silver is expected to outperform gold due to industrial demand (solar/EV) and extreme supply deficits. 2025 is seen as the breakout year.",
        targets: [
            { institution: 'J.P. Morgan', target: '$65', view: 'Bullish', date: 'Dec 2025' },
            { institution: 'Morgan Stanley', target: '$72', view: 'Bullish', date: 'Q1 2026' },
            { institution: 'Citi Bank', target: '$60+', view: 'Bullish', date: 'Mid 2025' }
        ],
        risks: ['Industrial slowdown', 'Mining supply increases']
    },
    'SPX': {
        summary: "S&P 500 momentum continues driven by earnings growth and interest rate normalization. Tech remains the primary engine.",
        targets: [
            { institution: 'Goldman Sachs', target: '7,400', view: 'Bullish', date: 'Dec 2025' },
            { institution: 'UBS', target: '7,600', view: 'Bullish', date: 'Jan 2026' },
            { institution: 'Oppenheimer', target: '7,500', view: 'Bullish', date: 'EOY 2025' }
        ],
        risks: ['Inflation rebound', 'Corporate tax policy changes']
    },
    'OIL': {
        summary: "WTI Crude faces headwinds as production surpluses balance out geopolitical risk premiums. Bearish bias dominates long-term outlook.",
        targets: [
            { institution: 'Citi', target: '$65', view: 'Bearish', date: 'Dec 2025' },
            { institution: 'J.P. Morgan', target: '$70', view: 'Neutral', date: 'Mid 2025' },
            { institution: 'Goldman Sachs', target: '$75', view: 'Neutral', date: 'Q4 2025' }
        ],
        risks: ['Supply disruptions', 'OPEC+ production cuts']
    },
    'ETH': {
        summary: "Ethereum remains the foundational layer for institutional DeFi. Scaling solutions drive mass adoption through 2026.",
        targets: [
            { institution: 'Standard Chartered', target: '$12k', view: 'Bullish', date: 'Dec 2025' },
            { institution: 'Franklin Templeton', target: '$10k', view: 'Bullish', date: 'Jan 2026' }
        ],
        risks: ['Regulation clarity', 'Competition from L1s']
    },
    'SOL': {
        summary: "Solana's high-performance throughput wins market share from traditional financial rails. Network stability is the key focus.",
        targets: [
            { institution: 'VanEck', target: '$850', view: 'Bullish', date: 'Dec 2025' },
            { institution: 'Bernstein', target: '$600', view: 'Bullish', date: 'EOY 2025' }
        ],
        risks: ['Network outages', 'Security centralization']
    }
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { ticker, commodity, type } = await req.json();
        const subject = (commodity || ticker || '').toUpperCase();

        // 1. Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? "";
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "";
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2. Check Ground Truth (Priority)
        if (GROUND_TRUTH[subject]) {
            console.log(`Returning Ground Truth for ${subject}`);
            return new Response(JSON.stringify({ ...GROUND_TRUTH[subject], source: 'ground_truth' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 3. Check Database for Cached Data (within 24 hours)
        const { data: cached } = await supabase
            .from('institutional_forecasts')
            .select('*')
            .eq('asset', subject)
            .order('created_at', { ascending: false })
            .limit(1);

        if (cached && cached.length > 0) {
            const age = new Date().getTime() - new Date(cached[0].created_at).getTime();
            if (age < 86400000) { // 24 hours
                console.log(`Returning cached data for ${subject}`);
                return new Response(JSON.stringify(JSON.parse(cached[0].data)), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // 4. Fallback to Gemini with Search Grounding
        const apiKey = Deno.env.get('GEMINI_API_KEY');
        const prompt = `
          Act as a senior market analyst.
          Find the latest 2025-2026 institutional price targets for ${subject} (${type}) from banks like Goldman Sachs, JPM, UBS.
          Return ONLY valid JSON:
          {
            "summary": "2-sentence executive summary.",
            "targets": [{"institution": "Bank Name", "target": "Price", "view": "Bullish", "date": "Month Year"}],
            "risks": ["Risk 1", "Risk 2"]
          }
        `;

        const geminiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await geminiResp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const result = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
        const finalResult = { ...result, source: 'ai_search' };

        // 5. Persist to Database
        try {
            await supabase.from('institutional_forecasts').delete().eq('asset', subject);
            await supabase.from('institutional_forecasts').insert({
                asset: subject,
                data: JSON.stringify(finalResult),
                created_at: new Date().toISOString()
            });
        } catch (dbErr) {
            console.error('Database persistence failed:', dbErr);
        }

        return new Response(JSON.stringify(finalResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
