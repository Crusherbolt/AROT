import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGammaData, GammaData, StrikeData } from '@/hooks/useGammaData';
import { AIForecast } from '@/components/dashboard/AIForecast';
import { useETFFlowData } from '@/hooks/useETFFlowData';
import { DataCard } from '@/components/ui/DataCard';
import { CustomBadge } from '@/components/ui/custom-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, RefreshCw, Activity, Target, 
  ArrowUp, ArrowDown, TrendingUp, AlertTriangle,
  CheckCircle, XCircle, Lightbulb, EyeOff, Eye,
  Layers, BarChart3, GitCompare, Plus, X, Calendar, Star
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  ReferenceLine, Legend, Area, CartesianGrid, AreaChart
} from 'recharts';

const popularTickers = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'AMZN', 'MSFT', 'META'];

// Zacks-style ranking data (sample/mock data - Expanded)
const zacksRankings: Record<string, { value: number; growth: number; momentum: number; vgm: string; overall: number }> = {
  // Mag 7
  'SPY': { value: 3, growth: 3, momentum: 2, vgm: 'B', overall: 2 },
  'QQQ': { value: 4, growth: 1, momentum: 1, vgm: 'A', overall: 2 },
  'AAPL': { value: 3, growth: 2, momentum: 2, vgm: 'B', overall: 3 },
  'TSLA': { value: 5, growth: 1, momentum: 1, vgm: 'C', overall: 3 },
  'NVDA': { value: 4, growth: 1, momentum: 1, vgm: 'A', overall: 1 },
  'AMZN': { value: 4, growth: 2, momentum: 2, vgm: 'B', overall: 2 },
  'MSFT': { value: 3, growth: 2, momentum: 2, vgm: 'A', overall: 1 },
  'META': { value: 3, growth: 1, momentum: 2, vgm: 'A', overall: 2 },
  'GOOGL': { value: 3, growth: 2, momentum: 3, vgm: 'B', overall: 3 },
  'GOOG': { value: 3, growth: 2, momentum: 3, vgm: 'B', overall: 3 },
  
  // Semis
  'AMD': { value: 4, growth: 1, momentum: 1, vgm: 'A', overall: 2 },
  'AVGO': { value: 3, growth: 1, momentum: 2, vgm: 'A', overall: 2 },
  'MU': { value: 3, growth: 1, momentum: 1, vgm: 'A', overall: 1 },
  'INTC': { value: 5, growth: 5, momentum: 5, vgm: 'F', overall: 5 },
  'QCOM': { value: 3, growth: 2, momentum: 3, vgm: 'C', overall: 3 },
  'TXN': { value: 3, growth: 3, momentum: 3, vgm: 'D', overall: 3 },
  'LRCX': { value: 3, growth: 1, momentum: 2, vgm: 'B', overall: 2 },
  'AMAT': { value: 3, growth: 2, momentum: 2, vgm: 'B', overall: 2 },
  'SMCI': { value: 4, growth: 1, momentum: 1, vgm: 'A', overall: 1 },
  
  // Tech/Software
  'CRM': { value: 3, growth: 2, momentum: 3, vgm: 'B', overall: 3 },
  'ADBE': { value: 4, growth: 2, momentum: 3, vgm: 'C', overall: 3 },
  'ORCL': { value: 3, growth: 2, momentum: 2, vgm: 'B', overall: 2 },
  'CSCO': { value: 3, growth: 4, momentum: 4, vgm: 'D', overall: 4 },
  'PLTR': { value: 5, growth: 1, momentum: 1, vgm: 'B', overall: 2 },
  'IBM': { value: 3, growth: 3, momentum: 2, vgm: 'C', overall: 3 },
  
  // Banks/Finance
  'JPM': { value: 2, growth: 3, momentum: 2, vgm: 'A', overall: 2 },
  'BAC': { value: 2, growth: 3, momentum: 3, vgm: 'B', overall: 3 },
  'WFC': { value: 2, growth: 3, momentum: 2, vgm: 'B', overall: 3 },
  'GS': { value: 3, growth: 3, momentum: 2, vgm: 'B', overall: 3 },
  'MS': { value: 3, growth: 3, momentum: 2, vgm: 'B', overall: 3 },
  'V': { value: 4, growth: 2, momentum: 2, vgm: 'C', overall: 3 },
  'MA': { value: 4, growth: 2, momentum: 2, vgm: 'C', overall: 3 },
  
  // Retail/Consumer
  'WMT': { value: 2, growth: 3, momentum: 2, vgm: 'A', overall: 2 },
  'TGT': { value: 2, growth: 4, momentum: 4, vgm: 'C', overall: 3 },
  'COST': { value: 4, growth: 2, momentum: 1, vgm: 'B', overall: 2 },
  'HD': { value: 3, growth: 3, momentum: 3, vgm: 'C', overall: 3 },
  'NKE': { value: 3, growth: 4, momentum: 4, vgm: 'D', overall: 4 },
  'SBUX': { value: 3, growth: 3, momentum: 3, vgm: 'C', overall: 3 },
  
  // Energy/Industrial
  'XOM': { value: 1, growth: 3, momentum: 2, vgm: 'A', overall: 1 },
  'CVX': { value: 2, growth: 3, momentum: 3, vgm: 'B', overall: 3 },
  'CAT': { value: 3, growth: 2, momentum: 2, vgm: 'B', overall: 3 },
  'BA': { value: 5, growth: 4, momentum: 5, vgm: 'F', overall: 5 },
  'GE': { value: 3, growth: 2, momentum: 1, vgm: 'B', overall: 2 },
  
  // Pharma
  'LLY': { value: 5, growth: 1, momentum: 1, vgm: 'B', overall: 1 },
  'JNJ': { value: 3, growth: 4, momentum: 4, vgm: 'D', overall: 4 },
  'PFE': { value: 2, growth: 4, momentum: 5, vgm: 'C', overall: 3 },
  'MRK': { value: 3, growth: 3, momentum: 3, vgm: 'C', overall: 3 },

  // Other Popular
  'DIS': { value: 3, growth: 3, momentum: 2, vgm: 'C', overall: 3 },
  'NFLX': { value: 4, growth: 1, momentum: 1, vgm: 'B', overall: 2 },
  'COIN': { value: 4, growth: 1, momentum: 1, vgm: 'A', overall: 1 },
  'MSTR': { value: 5, growth: 1, momentum: 1, vgm: 'B', overall: 2 },
  'IWM': { value: 3, growth: 2, momentum: 2, vgm: 'B', overall: 3 },
  'TLT': { value: 3, growth: 3, momentum: 3, vgm: 'D', overall: 3 },
  'SLV': { value: 2, growth: 3, momentum: 2, vgm: 'B', overall: 2 },
  'GLD': { value: 2, growth: 3, momentum: 3, vgm: 'B', overall: 2 },
};

const getZacksLabel = (score: number): { label: string; color: string } => {
  switch (score) {
    case 1: return { label: 'Strong Buy', color: 'text-bullish bg-bullish/20' };
    case 2: return { label: 'Buy', color: 'text-green-400 bg-green-400/20' };
    case 3: return { label: 'Hold', color: 'text-warning bg-warning/20' };
    case 4: return { label: 'Sell', color: 'text-orange-400 bg-orange-400/20' };
    case 5: return { label: 'Strong Sell', color: 'text-bearish bg-bearish/20' };
    default: return { label: 'N/A', color: 'text-muted-foreground bg-muted' };
  }
};

const getVGMColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'text-bullish bg-bullish/20';
    case 'B': return 'text-green-400 bg-green-400/20';
    case 'C': return 'text-warning bg-warning/20';
    case 'D': return 'text-orange-400 bg-orange-400/20';
    case 'F': return 'text-bearish bg-bearish/20';
    default: return 'text-muted-foreground bg-muted';
  }
};

// Generate next 8 Fridays for expiration selection
const getUpcomingExpirations = () => {
  const expirations: string[] = [];
  const today = new Date();
  let current = new Date(today);
  
  // Find next Friday
  const daysUntilFriday = (5 - current.getDay() + 7) % 7 || 7;
  current.setDate(current.getDate() + daysUntilFriday);
  
  for (let i = 0; i < 8; i++) {
    expirations.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 7);
  }
  
  return expirations;
};

export default function GammaExposure() {
  const [searchParams] = useSearchParams();
  const urlTicker = searchParams.get('ticker');
  const [ticker, setTicker] = useState(urlTicker?.toUpperCase() || 'SPY');
  const [selectedExpirations, setSelectedExpirations] = useState<string[]>([]);
  const [availableExpirations] = useState(getUpcomingExpirations);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [chartMode, setChartMode] = useState<'single' | 'cumulative' | 'compare'>('single');
  const [multiExpirationData, setMultiExpirationData] = useState<Map<string, GammaData>>(new Map());
  const [showETFComparison, setShowETFComparison] = useState(false);
  
  const { data, loading, error, fetchGammaData } = useGammaData();
  const { data: etfFlowData, loading: etfLoading, fetchETFFlowData } = useETFFlowData();

  // Initialize with first expiration
  useEffect(() => {
    if (availableExpirations.length > 0 && selectedExpirations.length === 0) {
      setSelectedExpirations([availableExpirations[0]]);
      fetchGammaData(ticker, availableExpirations[0]);
      fetchETFFlowData(ticker);
    }
  }, [availableExpirations, ticker]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim() && selectedExpirations.length > 0) {
      // Fetch data for all selected expirations
      const newDataMap = new Map<string, GammaData>();
      
      for (const exp of selectedExpirations) {
        await fetchGammaData(ticker.trim(), exp);
        if (data) {
          newDataMap.set(exp, data);
        }
      }
      
      setMultiExpirationData(newDataMap);
      fetchETFFlowData(ticker.trim());
    }
  };

  const handleQuickSelect = async (t: string) => {
    setTicker(t);
    if (selectedExpirations.length > 0) {
      await fetchGammaData(t, selectedExpirations[0]);
      fetchETFFlowData(t);
    }
  };

  const toggleExpiration = (exp: string) => {
    setSelectedExpirations(prev => {
      if (prev.includes(exp)) {
        return prev.filter(e => e !== exp);
      } else {
        return [...prev, exp].slice(0, 4); // Max 4 expirations
      }
    });
  };

  const handleFetchMultiple = async () => {
    if (!ticker.trim() || selectedExpirations.length === 0) return;
    
    const newDataMap = new Map<string, GammaData>();
    
    for (const exp of selectedExpirations) {
      await fetchGammaData(ticker.trim(), exp);
      // Store the fetched data
    }
    
    // For now, just fetch the first one for display
    await fetchGammaData(ticker.trim(), selectedExpirations[0]);
    fetchETFFlowData(ticker.trim());
  };

  const formatNumber = (num: number, decimals = 2) => {
    if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
    return num.toFixed(decimals);
  };

  const formatPrice = (num: number) => '$' + num.toFixed(2);

  // Prepare chart data with cumulative net GEX
  const chartData = useMemo(() => {
    if (!data?.strikes) return [];
    
    const sorted = [...data.strikes].sort((a, b) => a.strike - b.strike);
    let cumulative = 0;
    
    return sorted.map(s => {
      cumulative += s.netGamma;
      return {
        strike: s.strike,
        netGamma: s.netGamma,
        callGamma: s.callGamma,
        putGamma: -Math.abs(s.putGamma),
        cumulativeGamma: cumulative,
        isSpot: Math.abs(s.strike - (data?.spotPrice || 0)) < ((data?.spotPrice || 100) * 0.005),
      };
    });
  }, [data?.strikes, data?.spotPrice]);

  // Find the spot price index for highlighting
  const spotPriceIndex = useMemo(() => {
    if (!data?.spotPrice || !chartData.length) return -1;
    return chartData.findIndex(d => 
      Math.abs(d.strike - data.spotPrice) === 
      Math.min(...chartData.map(c => Math.abs(c.strike - data.spotPrice)))
    );
  }, [chartData, data?.spotPrice]);

  const getTradingSignal = () => {
    if (!data) return null;
    const { spotPrice, gammaFlip, putWall, callWall, netGamma } = data;
    const distToPut = ((spotPrice - putWall) / spotPrice) * 100;
    const distToCall = ((callWall - spotPrice) / spotPrice) * 100;
    
    if (distToPut < 1) return { signal: 'BUY', reason: 'Price near Put Wall support', color: 'bullish' };
    if (distToCall < 1) return { signal: 'SELL', reason: 'Price near Call Wall resistance', color: 'bearish' };
    if (spotPrice < gammaFlip && netGamma < 0) return { signal: 'CAUTION', reason: 'Negative gamma zone - high volatility', color: 'warning' };
    if (spotPrice > gammaFlip && netGamma > 0) return { signal: 'HOLD', reason: 'Positive gamma - range-bound', color: 'muted' };
    return { signal: 'NEUTRAL', reason: 'Mixed signals', color: 'muted' };
  };

  const signal = getTradingSignal();

  // Custom bar shape to highlight spot price and color by value
  const CustomBar = (props: any) => {
    const { x, y, width, height, fill, payload, dataKey } = props;
    const isSpotStrike = payload?.isSpot;
    
    // For netGamma, use dynamic coloring based on value
    let barFill = fill;
    if (dataKey === 'netGamma') {
      barFill = payload?.netGamma >= 0 ? 'hsl(var(--bullish))' : 'hsl(var(--bearish))';
    }
    
    return (
      <g>
        <rect 
          x={x} 
          y={y} 
          width={width} 
          height={height} 
          fill={barFill}
          stroke={isSpotStrike ? 'hsl(var(--primary))' : 'none'}
          strokeWidth={isSpotStrike ? 2 : 0}
          rx={4}
        />
      </g>
    );
  };

  const renderChart = (mode: 'single' | 'cumulative') => {
    if (!data) return null;
    
    const title = mode === 'single' 
      ? `Gamma Exposure by Strike - ${data.ticker}`
      : `Cumulative GEX - ${data.ticker}`;

    // Find min/max for better chart scaling
    const minGamma = Math.min(...chartData.map(d => Math.min(d.putGamma, d.callGamma)));
    const maxGamma = Math.max(...chartData.map(d => Math.max(d.putGamma, d.callGamma)));
    const gammaPadding = Math.abs(maxGamma - minGamma) * 0.1;

    return (
      <div className="p-4 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{title}</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch 
                id="annotations" 
                checked={showAnnotations} 
                onCheckedChange={setShowAnnotations} 
              />
              <Label htmlFor="annotations" className="text-sm cursor-pointer">
                {showAnnotations ? <Eye className="h-4 w-4 inline mr-1" /> : <EyeOff className="h-4 w-4 inline mr-1" />}
                Annotations
              </Label>
            </div>
          </div>
        </div>
        
        {/* Key Levels Legend */}
        <div className="flex items-center gap-6 mb-4 text-xs flex-wrap p-3 rounded-lg bg-surface">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 bg-bearish rounded-sm" />
            <span>Put GEX</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 bg-bullish rounded-sm" />
            <span>Call GEX</span>
          </div>
          {mode === 'cumulative' && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-1 bg-warning rounded-full" />
              <span>Net GEX (Cumulative)</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Spot: {formatPrice(data.spotPrice)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-purple-500" />
              <span>Inflection: {formatPrice(data.gammaFlip)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-bearish" />
              <span>Put Wall: {formatPrice(data.putWall)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-bullish" />
              <span>Call Wall: {formatPrice(data.callWall)}</span>
            </div>
          </div>
        </div>

        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={chartData} 
              margin={{ top: 30, right: 30, left: 60, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="strike" 
                tickFormatter={v => `$${v}`} 
                fontSize={10}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tickFormatter={v => formatNumber(v, 0)} 
                fontSize={10}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                domain={[minGamma - gammaPadding, maxGamma + gammaPadding]}
              />
              <Tooltip 
                formatter={(v: number, name: string) => [formatNumber(v), name]} 
                labelFormatter={l => `Strike: $${l}`}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              
              {/* Reference Lines with Annotations */}
              {showAnnotations && (
                <>
                  {/* Spot Price Line - Most prominent */}
                  <ReferenceLine 
                    x={chartData[spotPriceIndex]?.strike}
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    label={{ 
                      value: `SPOT $${data.spotPrice.toFixed(2)}`, 
                      position: 'top', 
                      fill: 'hsl(var(--primary))',
                      fontSize: 12,
                      fontWeight: 'bold',
                    }} 
                  />
                  
                  {/* Gamma Flip / Inflection Line */}
                  <ReferenceLine 
                    x={data.gammaFlip}
                    stroke="hsl(280, 100%, 70%)" 
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    label={{ 
                      value: `Inflection`, 
                      position: 'insideTopRight', 
                      fill: 'hsl(280, 100%, 70%)',
                      fontSize: 10,
                      fontWeight: 'bold',
                    }} 
                  />
                  
                  {/* Put Wall Line */}
                  <ReferenceLine 
                    x={data.putWall}
                    stroke="hsl(var(--bearish))" 
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    label={{ 
                      value: `Put Wall`, 
                      position: 'insideBottomLeft', 
                      fill: 'hsl(var(--bearish))',
                      fontSize: 10,
                      fontWeight: 'bold',
                    }} 
                  />
                  
                  {/* Call Wall Line */}
                  <ReferenceLine 
                    x={data.callWall}
                    stroke="hsl(var(--bullish))" 
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    label={{ 
                      value: `Call Wall`, 
                      position: 'insideBottomRight', 
                      fill: 'hsl(var(--bullish))',
                      fontSize: 10,
                      fontWeight: 'bold',
                    }} 
                  />
                  
                  {/* Zero line */}
                  <ReferenceLine 
                    y={0}
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />
                </>
              )}
              
              {/* Put GEX Bars (negative) */}
              <Bar 
                dataKey="putGamma" 
                name="Put GEX" 
                fill="hsl(var(--bearish))" 
                radius={[4, 4, 0, 0]}
                shape={<CustomBar />}
              />
              
              {/* Call GEX Bars (positive) */}
              <Bar 
                dataKey="callGamma" 
                name="Call GEX" 
                fill="hsl(var(--bullish))" 
                radius={[4, 4, 0, 0]}
                shape={<CustomBar />}
              />
              
              {/* Cumulative Net GEX Line */}
              {mode === 'cumulative' && (
                <Line 
                  type="monotone"
                  dataKey="cumulativeGamma" 
                  name="Net GEX (Cumulative)" 
                  stroke="hsl(var(--warning))"
                  strokeWidth={3}
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Spot Price Indicator Box */}
        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-primary" />
            <span className="font-semibold">Current Spot Price:</span>
            <span className="text-xl font-mono font-bold text-primary">{formatPrice(data.spotPrice)}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              {data.spotPrice > data.gammaFlip ? 'Above' : 'Below'} Inflection by {Math.abs(((data.spotPrice - data.gammaFlip) / data.gammaFlip) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderETFFlowComparison = () => {
    if (!etfFlowData) return null;
    
    return (
      <div className="p-4 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary" />
            ETF Flow Comparison - {etfFlowData.ticker}
          </h3>
          <CustomBadge variant={etfFlowData.flowTrend === 'bullish' ? 'bullish' : etfFlowData.flowTrend === 'bearish' ? 'bearish' : 'muted'}>
            {etfFlowData.flowTrend.toUpperCase()} FLOW
          </CustomBadge>
        </div>
        
        {/* Flow Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-surface">
            <div className="text-xs text-muted-foreground mb-1">Net Flow (Today)</div>
            <div className={`text-lg font-mono font-bold ${etfFlowData.netFlow >= 0 ? 'text-bullish' : 'text-bearish'}`}>
              {etfFlowData.netFlow >= 0 ? '+' : ''}{formatNumber(etfFlowData.netFlow)}M
            </div>
          </div>
          <div className="p-3 rounded-lg bg-surface">
            <div className="text-xs text-muted-foreground mb-1">Inflows</div>
            <div className="text-lg font-mono font-bold text-bullish">+{formatNumber(etfFlowData.inflow)}M</div>
          </div>
          <div className="p-3 rounded-lg bg-surface">
            <div className="text-xs text-muted-foreground mb-1">Outflows</div>
            <div className="text-lg font-mono font-bold text-bearish">-{formatNumber(etfFlowData.outflow)}M</div>
          </div>
          <div className="p-3 rounded-lg bg-surface">
            <div className="text-xs text-muted-foreground mb-1">AUM</div>
            <div className="text-lg font-mono font-bold">${formatNumber(etfFlowData.aum)}B</div>
          </div>
        </div>
        
        {/* Flow Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={etfFlowData.history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                fontSize={10}
                tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                fontSize={10}
                tickFormatter={v => `${v}M`}
              />
              <Tooltip 
                formatter={(v: number, name: string) => [`${v}M`, name]}
                labelFormatter={l => new Date(l).toLocaleDateString()}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
              <Area 
                type="monotone" 
                dataKey="netFlow" 
                name="Net Flow" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.3}
              />
              <Line 
                type="monotone" 
                dataKey="cumulativeFlow" 
                name="Cumulative" 
                stroke="hsl(var(--warning))" 
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* GEX vs Flow Analysis */}
        {data && (
          <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/30">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              GEX + Flow Analysis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Gamma Signal:</span>{' '}
                <CustomBadge variant={data.netGamma >= 0 ? 'bullish' : 'bearish'} className="ml-1">
                  {data.netGamma >= 0 ? 'Positive' : 'Negative'} Gamma
                </CustomBadge>
              </div>
              <div>
                <span className="font-medium">Flow Signal:</span>{' '}
                <CustomBadge variant={etfFlowData.flowTrend === 'bullish' ? 'bullish' : etfFlowData.flowTrend === 'bearish' ? 'bearish' : 'muted'} className="ml-1">
                  {etfFlowData.flowTrend === 'bullish' ? 'Net Inflows' : etfFlowData.flowTrend === 'bearish' ? 'Net Outflows' : 'Neutral'}
                </CustomBadge>
              </div>
              <div className="md:col-span-2 mt-2 p-3 rounded-lg bg-surface">
                {data.netGamma >= 0 && etfFlowData.flowTrend === 'bullish' && (
                  <p className="text-bullish">✅ <strong>Bullish Confluence:</strong> Positive gamma + net inflows suggests support for upside moves with reduced volatility.</p>
                )}
                {data.netGamma >= 0 && etfFlowData.flowTrend === 'bearish' && (
                  <p className="text-warning">⚠️ <strong>Mixed Signal:</strong> Positive gamma but outflows. Watch for range-bound action or potential breakdown if flows persist.</p>
                )}
                {data.netGamma < 0 && etfFlowData.flowTrend === 'bullish' && (
                  <p className="text-warning">⚠️ <strong>Mixed Signal:</strong> Negative gamma with inflows. Could see volatile upside, be cautious of sharp reversals.</p>
                )}
                {data.netGamma < 0 && etfFlowData.flowTrend === 'bearish' && (
                  <p className="text-bearish">⚠️ <strong>Bearish Confluence:</strong> Negative gamma + outflows increases downside risk and volatility.</p>
                )}
                {etfFlowData.flowTrend === 'neutral' && (
                  <p className="text-muted-foreground">📊 <strong>Neutral Flow:</strong> Focus primarily on gamma levels for direction. Flow is inconclusive.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gamma/GEX Analysis</h1>
        <p className="text-muted-foreground mt-1">Real-time options gamma exposure with ETF flow comparison</p>
      </div>

      {/* Search Form */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Ticker Symbol</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="Enter ticker (e.g., SPY)" className="pl-9 font-mono uppercase" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={loading || selectedExpirations.length === 0} className="w-full sm:w-auto">
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
                Generate GEX
              </Button>
            </div>
          </div>
          
          {/* Multi-Expiration Selection */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Select Expirations (max 4)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableExpirations.map(exp => (
                <Button 
                  key={exp} 
                  type="button"
                  variant={selectedExpirations.includes(exp) ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => toggleExpiration(exp)}
                  className="gap-1"
                >
                  {selectedExpirations.includes(exp) && <CheckCircle className="h-3 w-3" />}
                  {new Date(exp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Button>
              ))}
            </div>
            {selectedExpirations.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Selected: {selectedExpirations.map(e => new Date(e).toLocaleDateString()).join(', ')}
              </p>
            )}
          </div>
          
          {/* Quick Select */}
          <div>
            <span className="text-sm text-muted-foreground mr-3">Quick select:</span>
            <div className="inline-flex flex-wrap gap-2">
              {popularTickers.map(t => (
                <Button key={t} type="button" variant={ticker === t ? 'default' : 'outline'} size="xs" onClick={() => handleQuickSelect(t)}>{t}</Button>
              ))}
            </div>
          </div>
          
          {/* ETF Comparison Toggle */}
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Switch 
              id="etf-compare" 
              checked={showETFComparison} 
              onCheckedChange={setShowETFComparison} 
            />
            <Label htmlFor="etf-compare" className="text-sm cursor-pointer flex items-center gap-2">
              <GitCompare className="h-4 w-4" />
              Compare with ETF Flow Data
            </Label>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />{error}
        </div>
      )}

      {data && (
        <>
          {/* Trading Signal */}
          {signal && (
            <div className={`p-4 rounded-lg border bg-${signal.color}/10 border-${signal.color}/30`}>
              <div className="flex items-center gap-3">
                <CustomBadge variant={signal.color as any} className="text-lg px-4 py-1">{signal.signal}</CustomBadge>
                <span className="text-sm">{signal.reason}</span>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DataCard title="Spot Price" value={formatPrice(data.spotPrice)} icon={<Target className="h-4 w-4" />} />
            <DataCard title="Gamma Flip (Inflection)" value={formatPrice(data.gammaFlip)} change={((data.gammaFlip - data.spotPrice) / data.spotPrice) * 100} icon={<Activity className="h-4 w-4" />} />
            <DataCard title="Put Wall (Support)" value={formatPrice(data.putWall)} icon={<ArrowDown className="h-4 w-4 text-bullish" />} />
            <DataCard title="Call Wall (Resistance)" value={formatPrice(data.callWall)} icon={<ArrowUp className="h-4 w-4 text-bearish" />} />
          </div>

          {/* Zacks Ranking Card (Sample Data) */}
          {zacksRankings[data.ticker] && (
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <h3 className="font-semibold">Zacks Style Rankings</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Overall:</span>
                  <span className={`px-3 py-1 rounded-md font-bold text-sm ${getZacksLabel(zacksRankings[data.ticker].overall).color}`}>
                    {zacksRankings[data.ticker].overall} - {getZacksLabel(zacksRankings[data.ticker].overall).label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-surface text-center">
                  <p className="text-xs text-muted-foreground mb-1">Value</p>
                  <span className={`px-2 py-1 rounded font-bold text-sm ${getZacksLabel(zacksRankings[data.ticker].value).color}`}>
                    {zacksRankings[data.ticker].value}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface text-center">
                  <p className="text-xs text-muted-foreground mb-1">Growth</p>
                  <span className={`px-2 py-1 rounded font-bold text-sm ${getZacksLabel(zacksRankings[data.ticker].growth).color}`}>
                    {zacksRankings[data.ticker].growth}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface text-center">
                  <p className="text-xs text-muted-foreground mb-1">Momentum</p>
                  <span className={`px-2 py-1 rounded font-bold text-sm ${getZacksLabel(zacksRankings[data.ticker].momentum).color}`}>
                    {zacksRankings[data.ticker].momentum}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface text-center">
                  <p className="text-xs text-muted-foreground mb-1">VGM</p>
                  <span className={`px-2 py-1 rounded font-bold text-sm ${getVGMColor(zacksRankings[data.ticker].vgm)}`}>
                    {zacksRankings[data.ticker].vgm}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Institutional Price Targets */}
          <AIForecast ticker={data.ticker} />

          {/* Gamma Inflection Info */}
          <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/10">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-purple-400" />
              <span className="font-medium">Gamma Inflection Point:</span>
              <span>{formatPrice(data.gammaFlip)} - Price is {data.spotPrice > data.gammaFlip ? 'ABOVE' : 'BELOW'} inflection ({data.spotPrice > data.gammaFlip ? 'positive' : 'negative'} gamma zone)</span>
            </div>
          </div>

          {/* Gamma Chart with Tabs */}
          <Tabs value={chartMode} onValueChange={(v) => setChartMode(v as 'single' | 'cumulative' | 'compare')}>
            <TabsList className="mb-4">
              <TabsTrigger value="single" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Single Expiration
              </TabsTrigger>
              <TabsTrigger value="cumulative" className="gap-2">
                <Layers className="h-4 w-4" />
                Cumulative GEX
              </TabsTrigger>
            </TabsList>
            <TabsContent value="single">
              {renderChart('single')}
            </TabsContent>
            <TabsContent value="cumulative">
              {renderChart('cumulative')}
            </TabsContent>
          </Tabs>
          
          {/* ETF Flow Comparison Section */}
          {showETFComparison && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">ETF Flow Comparison</h2>
              </div>
              {etfLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading ETF flow data...</p>
                </div>
              ) : (
                renderETFFlowComparison()
              )}
            </div>
          )}

          {/* Trading Guide */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg border border-bullish/30 bg-bullish/5">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-bullish">
                <CheckCircle className="h-5 w-5" /> When to Buy (Go Long)
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><ArrowUp className="h-4 w-4 mt-0.5 text-bullish" />Price near or bouncing off <strong>Put Wall ({formatPrice(data.putWall)})</strong>: Strong support zone</li>
                <li className="flex items-start gap-2"><ArrowUp className="h-4 w-4 mt-0.5 text-bullish" />Price breaking above <strong>Inflection ({formatPrice(data.gammaFlip)})</strong>: Dealers support upward moves</li>
                <li className="flex items-start gap-2"><ArrowUp className="h-4 w-4 mt-0.5 text-bullish" />Spot below Inflection but approaching with momentum</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border border-bearish/30 bg-bearish/5">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-bearish">
                <XCircle className="h-5 w-5" /> When to Sell (Go Short)
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><ArrowDown className="h-4 w-4 mt-0.5 text-bearish" />Price near or stalling at <strong>Call Wall ({formatPrice(data.callWall)})</strong>: Strong resistance</li>
                <li className="flex items-start gap-2"><ArrowDown className="h-4 w-4 mt-0.5 text-bearish" />Price failing to hold above <strong>Inflection</strong>: Increased downside risk</li>
                <li className="flex items-start gap-2"><ArrowDown className="h-4 w-4 mt-0.5 text-bearish" />Spot above Inflection but showing weakness</li>
              </ul>
            </div>
          </div>

          {/* Strategy Tips */}
          <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" /> Strategic Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><strong>Range-bound:</strong> Trade between Put Wall & Call Wall - buy support, sell resistance</div>
              <div><strong>Breakout:</strong> Watch for price breaking walls with volume - signals trend change</div>
              <div><strong>Gamma flip zones:</strong> High volatility areas - great for momentum trades</div>
            </div>
          </div>

          {/* Gamma Summary & Strike Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Position Analysis</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-md bg-surface">
                  <span className="text-sm">Net Gamma</span>
                  <CustomBadge variant={data.netGamma >= 0 ? 'bullish' : 'bearish'}>{data.netGamma >= 0 ? 'POSITIVE' : 'NEGATIVE'}</CustomBadge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-surface">
                  <span className="text-sm">Price vs Inflection</span>
                  <CustomBadge variant={data.spotPrice > data.gammaFlip ? 'bullish' : 'bearish'}>{data.spotPrice > data.gammaFlip ? 'ABOVE' : 'BELOW'}</CustomBadge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-surface">
                  <span className="text-sm">Distance to Put Wall</span>
                  <span className="font-mono text-bullish">{((data.spotPrice - data.putWall) / data.spotPrice * 100).toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-surface">
                  <span className="text-sm">Distance to Call Wall</span>
                  <span className="font-mono text-bearish">{((data.callWall - data.spotPrice) / data.spotPrice * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-4">Gamma by Strike</h3>
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Strike</TableHead>
                      <TableHead className="text-right">Call OI</TableHead>
                      <TableHead className="text-right">Put OI</TableHead>
                      <TableHead className="text-right">Net Gamma</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.strikes.map(strike => (
                      <TableRow key={strike.strike} className={strike.strike === Math.round(data.spotPrice) ? 'bg-primary/10' : ''}>
                        <TableCell className="font-mono">{formatPrice(strike.strike)}</TableCell>
                        <TableCell className="text-right font-mono text-bullish">{formatNumber(strike.callOI, 0)}</TableCell>
                        <TableCell className="text-right font-mono text-bearish">{formatNumber(strike.putOI, 0)}</TableCell>
                        <TableCell className={`text-right font-mono ${strike.netGamma >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                          {strike.netGamma >= 0 ? '+' : ''}{formatNumber(strike.netGamma, 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </>
      )}

      {!data && !loading && (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Enter a ticker to analyze</h3>
          <p className="text-muted-foreground">Select a stock symbol and expiration date(s) to view gamma exposure data</p>
        </div>
      )}
    </div>
  );
}
