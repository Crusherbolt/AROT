
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// User-provided Ground Truth for core assets (Updated 2026 Forecasts)
const GROUND_TRUTH: Record<string, any> = {
    'GOLD': {
        summary: "Goldman Sachs has raised its end‑2026 gold price forecast to $5,400 per ounce, citing strong demand from private investors and emerging‑market central banks. This bullish outlook reflects gold’s role as a hedge against geopolitical and currency risks, alongside Fed rate cuts.",
        targets: [
            { institution: 'UBS', target: '$6,200', view: 'Bullish', date: 'End-2026' },
            { institution: 'Goldman Sachs', target: '$5,400', view: 'Bullish', date: 'Dec 2026' },
            { institution: 'J.P. Morgan', target: '$4,900', view: 'Neutral', date: 'Q4 2026' }
        ],
        risks: ['Stronger USD persistence', 'Profit-taking after 2025 surge', 'Geopolitical easing']
    },
    'SILVER': {
        summary: "Goldman Sachs sees silver at $65/oz by end-2026, benefiting from industrial demand and high correlation with gold. UBS is even more aggressive, targeting $70+ on structural supply deficits.",
        targets: [
            { institution: 'UBS', target: '$70+', view: 'Bullish', date: 'End-2026' },
            { institution: 'Goldman Sachs', target: '$65', view: 'Bullish', date: 'Dec 2026' },
            { institution: 'J.P. Morgan', target: '$58', view: 'Neutral', date: 'Mid 2026' }
        ],
        risks: ['Industrial slowdown', 'Rupee depreciation impact (India)']
    },
    'SPX': {
        summary: "Goldman Sachs has revised its S&P 500 forecast to 7,600 by end‑2026, driven by AI productivity, tariff relief, and strong GDP growth. UBS is most aggressive, with targets reaching up to 8,100.",
        targets: [
            { institution: 'UBS', target: '8,100', view: 'Bullish', date: 'End-2026' },
            { institution: 'Goldman Sachs', target: '7,600', view: 'Bullish', date: 'Dec 2026' },
            { institution: 'J.P. Morgan', target: '7,000', view: 'Neutral', date: 'Mid 2026' }
        ],
        risks: ['Valuation stretch', 'Earnings growth disappointment', 'Fiscal risks']
    },
    'OIL': {
        summary: "Goldman Sachs is bearish on energy, forecasting WTI at $53/barrel average in 2026 due to surplus inventories (+2M bpd) and weak demand. Brent is expected to average $58.",
        targets: [
            { institution: 'J.P. Morgan', target: '$65', view: 'Neutral', date: 'Dec 2026' },
            { institution: 'UBS', target: '$60', view: 'Neutral', date: 'Mid 2026' },
            { institution: 'Goldman Sachs', target: '$53', view: 'Bearish', date: 'Avg 2026' }
        ],
        risks: ['OPEC+ aggressive cuts', 'Geopolitical supply shocks']
    },
    'GLD': { // Map ETF search to Commodity Ground Truth
        link: 'GOLD'
    },
    'SLV': {
        link: 'SILVER'
    },
    'SPY': {
        link: 'SPX'
    },
    'USO': {
        link: 'OIL'
    }
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { ticker, commodity, type } = await req.json();
        let subject = (commodity || ticker || '').toUpperCase();

        // 1. Resolve Link if it exists
        if (GROUND_TRUTH[subject]?.link) {
            subject = GROUND_TRUTH[subject].link;
        }

        // 2. Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? "";
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "";
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 3. Check Ground Truth (Priority)
        if (GROUND_TRUTH[subject]) {
            console.log(`Returning Ground Truth for ${subject}`);
            return new Response(JSON.stringify({ ...GROUND_TRUTH[subject], source: 'ground_truth' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 4. Check Database for Cached Data (within 24 hours)
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

        // 5. Fallback to Gemini with Search Grounding
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

        // 6. Persist to Database
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
