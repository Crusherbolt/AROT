
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { ticker, commodity } = await req.json();
        const apiKey = Deno.env.get('GEMINI_API_KEY') || "AIzaSyAYvQmAV9HZYmmLb7U8y5AvPDH-SQGds_A"; // Fallback for dev if env not set in edge

        // Construct prompt for Gemini
        const prompt = `
      Act as a senior market analyst.
      Search for and summarize the latest 2025-2026 price targets and forecasts for ${commodity || ticker} from major institutions like Goldman Sachs, JP Morgan, Citi, Bank of America, and Morgan Stanley.
      
      Format the response as a JSON object with:
      - "summary": A 2-sentence executive summary of the consensus view.
      - "targets": An array of objects { "institution": "Bank Name", "target": "Price", "view": "Bullish/Bearish/Neutral", "date": "Month Year" } (max 4).
      - "risks": A short bulleted list of 2 key upside/downside risks.
      
      Focus on recent reports from late 2024 to present. If exact recent specific targets aren't found, estimate consensus based on general sector outlooks.
      Return ONLY valid JSON.
    `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();

        // Parse Gemini text response to JSON
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        // Clean up markdown code blocks if present
        const jsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(jsonStr);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
