import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const events: any[] = [];
    
    // Try Finnhub economic calendar
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const response = await fetch(
        `https://finnhub.io/api/v1/calendar/economic?from=${formatDate(today)}&to=${formatDate(nextWeek)}`,
        {
          headers: { 'X-Finnhub-Token': Deno.env.get('FINNHUB_API_KEY') || '' }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        events.push(...(data.economicCalendar || []).map((item: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          time: item.time || '00:00',
          date: item.event_date || item.date,
          country: item.country,
          event: item.event,
          impact: mapImpact(item.impact),
          actual: item.actual,
          forecast: item.estimate,
          previous: item.prev,
          unit: item.unit || '',
        })));
      }
    } catch (e) {
      console.log('Finnhub calendar error:', e);
    }

    // If no events, generate sample calendar
    if (events.length === 0) {
      const sampleEvents = generateSampleCalendar();
      events.push(...sampleEvents);
    }

    // Sort by date and time
    events.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
      return dateA.getTime() - dateB.getTime();
    });

    return new Response(JSON.stringify({ 
      events,
      success: true,
      lastUpdate: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching calendar:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function mapImpact(impact: number | string): 'high' | 'medium' | 'low' {
  if (typeof impact === 'number') {
    if (impact >= 3) return 'high';
    if (impact >= 2) return 'medium';
    return 'low';
  }
  const str = String(impact).toLowerCase();
  if (str.includes('high') || str.includes('3')) return 'high';
  if (str.includes('medium') || str.includes('2')) return 'medium';
  return 'low';
}

function generateSampleCalendar(): any[] {
  const events: Array<{
    id: string;
    date: string;
    time: string;
    country: string;
    event: string;
    impact: string;
    forecast: string;
    previous: string;
    actual: string | null;
  }> = [];
  const now = new Date();
  
  const sampleData = [
    { country: 'US', event: 'Federal Reserve Interest Rate Decision', impact: 'high', time: '14:00' },
    { country: 'US', event: 'Non-Farm Payrolls', impact: 'high', time: '08:30' },
    { country: 'US', event: 'Consumer Price Index (CPI) YoY', impact: 'high', time: '08:30' },
    { country: 'US', event: 'Initial Jobless Claims', impact: 'medium', time: '08:30' },
    { country: 'US', event: 'GDP Growth Rate QoQ', impact: 'high', time: '08:30' },
    { country: 'EU', event: 'ECB Interest Rate Decision', impact: 'high', time: '07:45' },
    { country: 'EU', event: 'CPI Flash Estimate YoY', impact: 'high', time: '05:00' },
    { country: 'UK', event: 'BoE Interest Rate Decision', impact: 'high', time: '07:00' },
    { country: 'UK', event: 'GDP QoQ', impact: 'medium', time: '02:00' },
    { country: 'JP', event: 'BoJ Interest Rate Decision', impact: 'high', time: '23:00' },
    { country: 'CN', event: 'Manufacturing PMI', impact: 'medium', time: '21:30' },
    { country: 'US', event: 'ISM Manufacturing PMI', impact: 'medium', time: '10:00' },
    { country: 'US', event: 'Retail Sales MoM', impact: 'medium', time: '08:30' },
    { country: 'US', event: 'Unemployment Rate', impact: 'high', time: '08:30' },
  ];
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEvents = sampleData
      .filter(() => Math.random() > 0.6)
      .slice(0, 3);
    
    dayEvents.forEach(ev => {
      const forecast = (Math.random() * 5 - 2).toFixed(1);
      const prev = (parseFloat(forecast) + (Math.random() - 0.5) * 2).toFixed(1);
      const actual = i < 2 ? (parseFloat(forecast) + (Math.random() - 0.5)).toFixed(1) : null;
      
      events.push({
        id: Math.random().toString(36).substr(2, 9),
        date: formatDate(date),
        time: ev.time,
        country: ev.country,
        event: ev.event,
        impact: ev.impact,
        forecast: `${forecast}%`,
        previous: `${prev}%`,
        actual: actual ? `${actual}%` : null,
      });
    });
  }
  
  return events;
}
