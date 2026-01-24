import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  country: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  actual: string | null;
  forecast: string;
  previous: string;
}

export function useCalendarData() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('fetch-calendar');

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (responseData?.success && responseData?.events) {
        setEvents(responseData.events);
      } else {
        throw new Error(responseData?.error || 'Failed to fetch calendar');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch calendar';
      setError(message);
      console.error('Calendar fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendar();
    
    // Update every 10 minutes
    const interval = setInterval(fetchCalendar, 600000);
    return () => clearInterval(interval);
  }, [fetchCalendar]);

  return { events, loading, error, refetch: fetchCalendar };
}
