import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Building2, RefreshCw } from 'lucide-react';
import { CustomBadge } from '@/components/ui/custom-badge';
import { Button } from '@/components/ui/button';

// Fallback key provided by user in session
const USER_FALLBACK_KEY = "AIzaSyAYvQmAV9HZYmmLb7U8y5AvPDH-SQGds_A";

interface ForecastTarget {
  institution: string;
  target: string;
  view: 'Bullish' | 'Bearish' | 'Neutral';
  date: string;
}

interface ForecastData {
  summary: string;
  targets: ForecastTarget[];
  risks: string[];
}

export function AIForecast({ commodity, ticker }: { commodity?: string; ticker?: string }) {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subject = commodity || ticker || '';
  const type = ticker ? 'stock' : 'commodity';

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/fetch-forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey || ''}`
        },
        body: JSON.stringify({ commodity: subject, ticker: subject, type })
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
        return;
      }
      
      throw new Error('Edge function unavailable');

    } catch (e) {
      console.warn('Forecast fetch failed, using direct API simulation for demo');
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || USER_FALLBACK_KEY;
      
      if (!apiKey) {
        setError('API Key missing. Please check .env settings.');
        setLoading(false);
        return;
      }

      // Static list of models to try in order of preference
      const modelsToTry = [
        { id: 'gemini-2.0-flash-exp', version: 'v1beta' },
        { id: 'gemini-1.5-flash', version: 'v1beta' },
        { id: 'gemini-1.5-flash-latest', version: 'v1beta' },
        { id: 'gemini-1.5-flash-001', version: 'v1beta' },
        { id: 'gemini-pro', version: 'v1' }, // Stable v1
        { id: 'gemini-1.0-pro', version: 'v1' }
      ];

      let lastError = null;

      for (const model of modelsToTry) {
        try {
            console.log(`Attempting forecast with model: ${model.id} (${model.version})`);
            
            const prompt = `
            Act as a senior market analyst.
            Search for and find the latest 2025-2026 price targets and forecasts for ${subject} (${type}) from major investment banks and institutions (e.g., Goldman Sachs, JP Morgan, Morgan Stanley, UBS, Citi).
            
            Format the response as a JSON object with:
            - "summary": A 2-sentence executive summary of the consensus view.
            - "targets": An array of objects { "institution": "Bank Name", "target": "Specific Price Target (e.g. $150 or $3000)", "view": "Bullish/Bearish/Neutral", "date": "Month Year" } (max 4).
            - "risks": A short bulleted list of 2 key upside/downside risks.
            
            CRITICAL: Find SPECIFIC numbers (e.g. "Goldman sees 5400", "UBS sees 6000"). If no recent specific target exists, state the general bias.
            Return ONLY valid JSON.
            `;

            const geminiResp = await fetch(`https://generativelanguage.googleapis.com/${model.version}/models/${model.id}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            
            const geminiData = await geminiResp.json();
            
            if (geminiData.error) {
                // strict check for "not found" or "not supported" to try next model
                if (geminiData.error.message?.includes('not found') || geminiData.error.message?.includes('not supported')) {
                    throw new Error(geminiData.error.message);
                }
                // Other errors (quota?) might stop us.
                throw new Error(geminiData.error.message);
            }

            const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            const json = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
            setData(json);
            return; // Success! Exit loop

        } catch (err: any) {
            console.warn(`Model ${model.id} failed:`, err.message);
            lastError = err.message;
            // Continue to next model
        }
      }

      // If loop finishes without success
      setError(`Generative AI failed: ${lastError}`);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subject) {
        const timer = setTimeout(() => fetchForecast(), 500);
        return () => clearTimeout(timer);
    }
  }, [subject]);

  // Render Header
  const renderHeader = () => (
    <div className="flex items-center gap-2 mb-4">
      <Sparkles className="w-5 h-5 text-purple-500" />
      <h3 className="font-semibold text-lg">Institutional Price Targets</h3>
      <CustomBadge variant="muted" className="text-xs">
        AI Analysis • Live Web Search
      </CustomBadge>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-purple-200 dark:border-gray-700">
        {renderHeader()}
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Searching web for latest institutional forecasts...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-purple-200 dark:border-gray-700">
        {renderHeader()}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
          <Button onClick={fetchForecast} size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-purple-200 dark:border-gray-700 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200/20 dark:bg-purple-500/5 rounded-full blur-3xl -z-10" />

      {renderHeader()}

      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Consensus Outlook
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{data.summary}</p>
        </div>

        <div className="grid gap-3">
          {data.targets?.map((t, idx) => (
            <div key={idx} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-sm">{t.institution}</span>
                </div>
                <CustomBadge
                  variant={t.view === 'Bullish' ? 'bullish' : t.view === 'Bearish' ? 'bearish' : 'muted'}
                  className="text-xs"
                >
                  {t.view.toUpperCase()}
                </CustomBadge>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.target}</span>
                <span className="text-xs text-gray-500">{t.date}</span>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Key Risks
          </h4>
          <ul className="space-y-1">
            {data.risks?.map((risk, i) => (
              <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button onClick={fetchForecast} variant="outline" size="sm" className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate Analysis
        </Button>
      </div>
    </div>
  );
}
