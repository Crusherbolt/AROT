import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface COTRecord {
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

// Legacy interface for backwards compatibility
export interface COTData {
  date: string;
  commodity: string;
  category?: string;
  commercialLong: number;
  commercialShort: number;
  commercialNet: number;
  nonCommercialLong: number;
  nonCommercialShort: number;
  nonCommercialNet: number;
  openInterest: number;
  changeInOI: number;
}

export function useCOTData(commodityCode?: string) {
  const [data, setData] = useState<COTRecord[]>([]);
  const [historical, setHistorical] = useState<Record<string, COTRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateMockCOTData = () => {
    const commodities = [
      { name: 'GOLD', code: '088691', category: 'commodities', price: 2000 },
      { name: 'SILVER', code: '084691', category: 'commodities', price: 23 },
      { name: 'S&P 500', code: '13874+', category: 'indices', price: 4500 },
      { name: 'NASDAQ 100', code: '20974+', category: 'indices', price: 15000 },
      { name: 'EUR/USD', code: '099741', category: 'forex', price: 1.08 },
      { name: 'GBP/USD', code: '096742', category: 'forex', price: 1.25 },
      { name: 'CRUDE OIL', code: '067651', category: 'commodities', price: 75 },
      { name: '10Y TREASURY', code: '043602', category: 'bonds', price: 110 }
    ];

    const mockData: COTRecord[] = [];
    const mockHistorical: Record<string, COTRecord[]> = {};

    commodities.forEach(comm => {
      // Generate 52 weeks of history
      const history: COTRecord[] = [];
      let currentOI = 100000 + Math.random() * 50000;
      let commNet = (Math.random() - 0.5) * 50000;

      for (let i = 0; i < 52; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (i * 7));

        // Random walk
        currentOI += (Math.random() - 0.5) * 5000;
        commNet += (Math.random() - 0.5) * 8000;

        const commLong = Math.abs(commNet > 0 ? commNet + 50000 : 50000);
        const commShort = Math.abs(commNet > 0 ? 50000 : 50000 - commNet);

        const nonCommNet = -commNet * 0.8; // Speculators usually opposite to commercials
        const nonCommLong = Math.abs(nonCommNet > 0 ? nonCommNet + 40000 : 40000);
        const nonCommShort = Math.abs(nonCommNet > 0 ? 40000 : 40000 - nonCommNet);

        const record: COTRecord = {
          date: date.toISOString(),
          commodity: comm.name,
          code: comm.code,
          category: comm.category,
          commercialLong: Math.round(commLong),
          commercialShort: Math.round(commShort),
          commercialNet: Math.round(commNet),
          nonCommercialLong: Math.round(nonCommLong),
          nonCommercialShort: Math.round(nonCommShort),
          nonCommercialNet: Math.round(nonCommNet),
          nonReportableLong: 10000,
          nonReportableShort: 5000,
          nonReportableNet: 5000,
          openInterest: Math.round(currentOI),
          changeLong: Math.round((Math.random() - 0.5) * 2000),
          changeShort: Math.round((Math.random() - 0.5) * 2000),
          changeNet: Math.round((Math.random() - 0.5) * 4000),
          changeOI: Math.round((Math.random() - 0.5) * 3000),
          percentOILong: 45,
          percentOIShort: 55,
          spreadPositions: 5000
        };

        history.push(record);
      }

      mockHistorical[comm.code] = history;
      mockData.push(history[0]); // Latest record
    });

    return { data: mockData, historical: mockHistorical, lastUpdate: new Date() };
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/data/cot.json');
      if (response.ok) {
        const localData = await response.json();

        if (localData && localData.length > 0) {
          const newHistorical: Record<string, COTRecord[]> = {};

          // Process flat list into historical map
          localData.forEach((row: any) => {
            // Map commodity name to code (simple mapping for now or use name as code)
            // The OpenDataSoft dataset uses specific names. We'll attempt to map to our known codes if possible or just group by name.
            // We'll use the 'commodity' field from JSON as key/code for simplicity in this generated mode.
            const code = row.commodity;
            if (!newHistorical[code]) newHistorical[code] = [];

            newHistorical[code].push({
              date: row.date,
              commodity: row.commodity,
              code: code,
              category: 'commodities', // Default
              commercialLong: 0,
              commercialShort: 0,
              commercialNet: row.commercialNet,
              nonCommercialLong: 0,
              nonCommercialShort: 0,
              nonCommercialNet: row.nonCommercialNet,
              nonReportableLong: 0,
              nonReportableShort: 0,
              nonReportableNet: 0,
              openInterest: row.openInterest,
              changeLong: 0,
              changeShort: 0,
              changeNet: 0,
              changeOI: 0,
              percentOILong: 50,
              percentOIShort: 50,
              spreadPositions: 0
            });
          });

          setHistorical(newHistorical);

          // Set latest data
          const latestItems: COTRecord[] = [];
          Object.keys(newHistorical).forEach(key => {
            // Sort date desc
            newHistorical[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            latestItems.push(newHistorical[key][0]);
          });

          setData(latestItems);
          setLastUpdate(new Date());
          setLoading(false);
          return;
        }
      }
      throw new Error('Local data empty or failed');
    } catch (e) {
      console.log('Using simulation for COT (Local fetch failed or empty)', e);
      // Simulate network delay
      setTimeout(() => {
        const result = generateMockCOTData();
        setData(result.data);
        setHistorical(result.historical);
        setLastUpdate(result.lastUpdate);
        setLoading(false);
      }, 600);
    }
  }, [commodityCode]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, historical, loading, lastUpdate, error, refetch: fetchData };
}

export function useCOTDetailData(commodityCode: string) {
  // Re-use main hook logic for simplicity in this demo, accessing specific code
  const { historical, loading, lastUpdate, error } = useCOTData();

  const data = historical[commodityCode] || [];
  const summary = data[0] || null;

  return { data, summary, loading, lastUpdate, error, refetch: () => { } };
}
