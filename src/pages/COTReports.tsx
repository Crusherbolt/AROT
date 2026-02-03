import { useState, useEffect } from 'react';
import { useCOTData, COTRecord } from '@/hooks/useCOTData';
import { AIForecast } from '@/components/dashboard/AIForecast';
import { CustomBadge } from '@/components/ui/custom-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, ArrowUpDown, Download, Filter, TrendingUp, Users, Info, ChevronRight, ArrowUp, ArrowDown, Calendar, Activity } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';

// Commodity to ETF mapping with sample gamma data
const commodityETFMap: Record<string, { etf: string; name: string; gamma: number; putWall: number; callWall: number; spotPrice: number }> = {
  'GOLD': { etf: 'GLD', name: 'SPDR Gold Shares', gamma: 12500000, putWall: 218, callWall: 235, spotPrice: 225.50 },
  'SILVER': { etf: 'SLV', name: 'iShares Silver Trust', gamma: 8200000, putWall: 26.50, callWall: 31.00, spotPrice: 28.75 },
  'CRUDE OIL': { etf: 'USO', name: 'United States Oil Fund', gamma: 5600000, putWall: 68.00, callWall: 78.00, spotPrice: 72.45 },
  'NATURAL GAS': { etf: 'UNG', name: 'United States Natural Gas Fund', gamma: 3400000, putWall: 5.50, callWall: 8.00, spotPrice: 6.80 },
  'COPPER': { etf: 'CPER', name: 'United States Copper Index Fund', gamma: 2100000, putWall: 24.00, callWall: 28.00, spotPrice: 25.80 },
  'CORN': { etf: 'CORN', name: 'Teucrium Corn Fund', gamma: 1800000, putWall: 18.50, callWall: 22.00, spotPrice: 20.25 },
  'WHEAT': { etf: 'WEAT', name: 'Teucrium Wheat Fund', gamma: 1500000, putWall: 5.00, callWall: 6.50, spotPrice: 5.75 },
  'SOYBEANS': { etf: 'SOYB', name: 'Teucrium Soybean Fund', gamma: 1200000, putWall: 24.00, callWall: 27.00, spotPrice: 25.50 },
  'S&P 500': { etf: 'SPY', name: 'SPDR S&P 500 ETF', gamma: 85000000, putWall: 580, callWall: 620, spotPrice: 598.00 },
  'E-MINI S&P 500': { etf: 'SPY', name: 'SPDR S&P 500 ETF', gamma: 85000000, putWall: 580, callWall: 620, spotPrice: 598.00 },
  'NASDAQ 100': { etf: 'QQQ', name: 'Invesco QQQ Trust', gamma: 42000000, putWall: 495, callWall: 535, spotPrice: 512.00 },
  'E-MINI NASDAQ': { etf: 'QQQ', name: 'Invesco QQQ Trust', gamma: 42000000, putWall: 495, callWall: 535, spotPrice: 512.00 },
  'RUSSELL 2000': { etf: 'IWM', name: 'iShares Russell 2000 ETF', gamma: 18000000, putWall: 195, callWall: 215, spotPrice: 205.00 },
  'DOW JONES': { etf: 'DIA', name: 'SPDR Dow Jones Industrial', gamma: 15000000, putWall: 435, callWall: 465, spotPrice: 448.00 },
  '10Y TREASURY': { etf: 'IEF', name: 'iShares 7-10 Year Treasury Bond ETF', gamma: 8500000, putWall: 92.50, callWall: 98.00, spotPrice: 95.50 },
  'EUR/USD': { etf: 'FXE', name: 'Invesco CurrencyShares Euro Trust', gamma: 4200000, putWall: 98.00, callWall: 104.00, spotPrice: 101.20 },
};

type SortField = 'commodity' | 'commercialNet' | 'nonCommercialNet' | 'openInterest' | 'changeOI';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'summary' | 'detailed';

export default function COTReports() {
  const { data, historical, loading, lastUpdate, refetch } = useCOTData();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('commodity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [category, setCategory] = useState<'all' | 'forex' | 'commodities' | 'indices' | 'bonds'>('all');
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('summary');

  const formatNumber = (num: number, showSign = false) => {
    const sign = showSign && num > 0 ? '+' : '';
    if (Math.abs(num) >= 1000000) {
      return sign + (num / 1000000).toFixed(2) + 'M';
    }
    if (Math.abs(num) >= 1000) {
      return sign + (num / 1000).toFixed(1) + 'K';
    }
    return sign + num.toLocaleString();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredData = data
    .filter(item => {
      const matchesSearch = item.commodity.toLowerCase().includes(search.toLowerCase()) ||
                           item.code?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'all' || item.category === category;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      
      if (typeof aVal === 'string') {
        return (aVal as string).localeCompare(bVal as string) * multiplier;
      }
      return ((aVal as number) - (bVal as number)) * multiplier;
    });

  const [searchParams] = useSearchParams();
  const urlCommodityCode = searchParams.get('code');
  const [timeFrame, setTimeFrame] = useState<'1M' | '3M' | '6M' | '1Y'>('1M');

  useEffect(() => {
    if (urlCommodityCode) {
      setSelectedCommodity(urlCommodityCode);
      setViewMode('detailed');
    }
  }, [urlCommodityCode]);

  // Scroll to top when a commodity is selected
  useEffect(() => {
    if (selectedCommodity) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCommodity]);

  const selectedHistory = selectedCommodity ? historical[selectedCommodity] || [] : [];
  
  // Filter history based on timeframe
  const filteredHistory = selectedHistory.filter(item => {
    const date = new Date(item.date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    switch (timeFrame) {
      case '1M': return diffDays <= 35; // Slightly more than 30 to catch month boundary
      case '3M': return diffDays <= 90;
      case '6M': return diffDays <= 180;
      case '1Y': return diffDays <= 365;
      default: return true;
    }
  });

  const chartData = [...filteredHistory].reverse().map(item => ({
    date: format(new Date(item.date), 'MMM d'),
    commercialNet: item.commercialNet,
    nonCommercialNet: item.nonCommercialNet,
    openInterest: item.openInterest,
  }));

  // Trend Analysis
  const getTrendAnalysis = () => {
    if (filteredHistory.length < 2) return { trend: 'NEUTRAL', color: 'muted' };
    const latest = filteredHistory[0];
    const prev = filteredHistory[Math.min(4, filteredHistory.length - 1)]; // Compare vs 1 month ago
    
    const commNetChange = latest.commercialNet - prev.commercialNet;
    
    if (commNetChange > 0 && latest.commercialNet > 0) return { trend: 'BUILDING LONG', color: 'bullish' };
    if (commNetChange < 0 && latest.commercialNet < 0) return { trend: 'BUILDING SHORT', color: 'bearish' };
    if (commNetChange > 0 && latest.commercialNet < 0) return { trend: 'COVERING SHORTS', color: 'bullish' };
    if (commNetChange < 0 && latest.commercialNet > 0) return { trend: 'LIQUIDATING LONGS', color: 'bearish' };
    
    return { trend: 'NEUTRAL', color: 'muted' };
  };

  const trend = getTrendAnalysis();

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button 
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : ''}`} />
    </button>
  );

  const ChangeCell = ({ value, showArrow = true }: { value: number; showArrow?: boolean }) => {
    const isPositive = value >= 0;
    return (
      <span className={`font-mono text-sm flex items-center justify-end gap-1 ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
        {showArrow && (isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
        {formatNumber(value, true)}
      </span>
    );
  };

  const ColoredCell = ({ value, isPercent = false }: { value: number; isPercent?: boolean }) => {
    // Color intensity based on value
    const intensity = Math.min(Math.abs(value) / (isPercent ? 50 : 100000), 1);
    const isPositive = value >= 0;
    
    return (
      <div 
        className={`px-2 py-1 rounded font-mono text-sm text-center ${
          isPositive 
            ? 'bg-bullish/20 text-bullish' 
            : 'bg-bearish/20 text-bearish'
        }`}
        style={{
          backgroundColor: isPositive 
            ? `rgba(34, 197, 94, ${0.1 + intensity * 0.3})`
            : `rgba(239, 68, 68, ${0.1 + intensity * 0.3})`
        }}
      >
        {isPercent ? `${value.toFixed(1)}%` : formatNumber(value, true)}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">COT Reports</h1>
          <p className="text-muted-foreground mt-1">
            Commitment of Traders - Professional Market Data Analysis
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant={viewMode === 'summary' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setViewMode('summary')}
          >
            Summary
          </Button>
          <Button 
            variant={viewMode === 'detailed' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setViewMode('detailed')}
          >
            Detailed
          </Button>
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Commercial Is Your Friend Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-primary/20">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-bullish" />
              Commercials Are Your Friend
            </h3>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              Commercial traders (hedgers) are typically producers and consumers of the underlying commodity. They have the best understanding 
              of supply and demand dynamics. When commercials are extremely net long, it often signals a market bottom. When extremely net short, 
              it may signal a top. <strong className="text-foreground">Follow the smart money - trade with commercials, not against them.</strong>
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-bullish"></div>
                <span>Commercial Net Long = Bullish Signal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-bearish"></div>
                <span>Commercial Net Short = Bearish Signal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <span>Non-Commercials (Speculators) = Contrarian Indicator</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search instruments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(['all', 'forex', 'commodities', 'indices', 'bonds'] as const).map(cat => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              size="xs"
              onClick={() => setCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className="text-sm text-muted-foreground">
          Last updated: {formatDistanceToNow(lastUpdate, { addSuffix: true })} • Data from CFTC
        </div>
      )}

      {/* Selected Commodity Detail View */}
      {selectedCommodity && selectedHistory.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{selectedHistory[0]?.commodity} Detailed COT Report</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Historical positioning data • {selectedHistory.length} weeks of data
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedCommodity(null)}>
              Close Detail View
            </Button>
          </div>

          {/* Chart Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-border">
              {(['1M', '3M', '6M', '1Y'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFrame(tf)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    timeFrame === tf 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Trend:</span>
              <CustomBadge variant={trend.color as any} className="gap-2">
                <TrendingUp className={`h-4 w-4 ${trend.color === 'bearish' ? 'rotate-180' : ''}`} />
                {trend.trend}
              </CustomBadge>
            </div>
          </div>

          {/* Chart */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="commGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--bullish))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--bullish))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="nonCommGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--bearish))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--bearish))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatNumber(v)} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => formatNumber(value)}
                />
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Area 
                  type="monotone" 
                  dataKey="commercialNet" 
                  name="Commercial Net"
                  stroke="hsl(var(--bullish))" 
                  fill="url(#commGradient)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="nonCommercialNet" 
                  name="Non-Commercial Net"
                  stroke="hsl(var(--bearish))" 
                  fill="url(#nonCommGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Related ETF Gamma Section */}
          {selectedHistory[0]?.commodity && commodityETFMap[selectedHistory[0].commodity.toUpperCase()] && (
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Related ETF Gamma Exposure</h3>
                </div>
                <CustomBadge variant="bullish" className="font-mono">
                  {commodityETFMap[selectedHistory[0].commodity.toUpperCase()].etf}
                </CustomBadge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {commodityETFMap[selectedHistory[0].commodity.toUpperCase()].name}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-surface">
                  <p className="text-xs text-muted-foreground mb-1">Net Gamma</p>
                  <p className="font-mono font-bold text-primary">
                    {(commodityETFMap[selectedHistory[0].commodity.toUpperCase()].gamma / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-surface">
                  <p className="text-xs text-muted-foreground mb-1">Spot Price</p>
                  <p className="font-mono font-bold">
                    ${commodityETFMap[selectedHistory[0].commodity.toUpperCase()].spotPrice.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-surface">
                  <p className="text-xs text-muted-foreground mb-1">Put Wall (Support)</p>
                  <p className="font-mono font-bold text-bullish">
                    ${commodityETFMap[selectedHistory[0].commodity.toUpperCase()].putWall.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-surface">
                  <p className="text-xs text-muted-foreground mb-1">Call Wall (Resistance)</p>
                  <p className="font-mono font-bold text-bearish">
                    ${commodityETFMap[selectedHistory[0].commodity.toUpperCase()].callWall.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3">
                💡 Use gamma levels alongside COT data for confluent trade signals. Net positive gamma above spot = bullish support.
              </p>
            </div>
          )}

          {/* AI Forecast Section */}
          {selectedHistory[0]?.commodity && (
             <AIForecast commodity={selectedHistory[0].commodity} />
          )}

          {/* Historical Data Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold sticky left-0 bg-muted/50">Report Date</TableHead>
                  <TableHead colSpan={4} className="text-center font-semibold border-l border-border bg-bullish/10">
                    COMMERCIAL
                  </TableHead>
                  <TableHead colSpan={4} className="text-center font-semibold border-l border-border bg-bearish/10">
                    NON-COMMERCIAL
                  </TableHead>
                  <TableHead colSpan={3} className="text-center font-semibold border-l border-border bg-muted/30">
                    NON-REPORTABLE
                  </TableHead>
                  <TableHead className="text-right font-semibold border-l border-border">Open Interest</TableHead>
                </TableRow>
                <TableRow className="bg-muted/30 text-xs">
                  <TableHead className="sticky left-0 bg-muted/30"></TableHead>
                  <TableHead className="text-right border-l border-border">Long</TableHead>
                  <TableHead className="text-right">Short</TableHead>
                  <TableHead className="text-right">Δ Long</TableHead>
                  <TableHead className="text-right">Net Position</TableHead>
                  <TableHead className="text-right border-l border-border">Long</TableHead>
                  <TableHead className="text-right">Short</TableHead>
                  <TableHead className="text-right">Δ Long</TableHead>
                  <TableHead className="text-right">Net Position</TableHead>
                  <TableHead className="text-right border-l border-border">Long</TableHead>
                  <TableHead className="text-right">Short</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right border-l border-border">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((row, idx) => (
                  <TableRow 
                    key={row.date}
                    className={`hover:bg-surface-hover ${idx === 0 ? 'bg-primary/5' : ''}`}
                  >
                    <TableCell className="font-medium sticky left-0 bg-card">
                      {format(new Date(row.date), 'd MMM yyyy')}
                      {idx === 0 && <CustomBadge variant="bullish" className="ml-2 text-[10px]">Latest</CustomBadge>}
                    </TableCell>
                    
                    {/* Commercial */}
                    <TableCell className="text-right font-mono text-sm border-l border-border">
                      {formatNumber(row.commercialLong)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatNumber(row.commercialShort)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ChangeCell value={row.changeLong} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ColoredCell value={row.commercialNet} />
                    </TableCell>
                    
                    {/* Non-Commercial */}
                    <TableCell className="text-right font-mono text-sm border-l border-border">
                      {formatNumber(row.nonCommercialLong)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatNumber(row.nonCommercialShort)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ChangeCell value={-row.changeShort} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ColoredCell value={row.nonCommercialNet} />
                    </TableCell>
                    
                    {/* Non-Reportable */}
                    <TableCell className="text-right font-mono text-sm border-l border-border">
                      {formatNumber(row.nonReportableLong)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatNumber(row.nonReportableShort)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ColoredCell value={row.nonReportableNet} />
                    </TableCell>
                    
                    {/* Open Interest */}
                    <TableCell className="text-right font-mono text-sm border-l border-border">
                      {formatNumber(row.openInterest)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Summary Data Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">
                  <SortButton field="commodity">Instrument</SortButton>
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Commercial Long
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Commercial Short
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <SortButton field="commercialNet">Commercial Net</SortButton>
                </TableHead>
                <TableHead className="text-right font-semibold">
                  % OI Long
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Non-Comm Long
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Non-Comm Short
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <SortButton field="nonCommercialNet">Non-Comm Net</SortButton>
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <SortButton field="openInterest">Open Interest</SortButton>
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <SortButton field="changeOI">Δ OI</SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row, idx) => (
                <TableRow 
                  key={row.commodity}
                  className={`hover:bg-surface-hover animate-fade-up cursor-pointer ${selectedCommodity === row.code ? 'bg-primary/10' : ''}`}
                  style={{ animationDelay: `${idx * 30}ms` }}
                  onClick={() => setSelectedCommodity(row.code)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <CustomBadge 
                        variant={row.category === 'forex' ? 'bullish' : row.category === 'commodities' ? 'warning' : 'muted'} 
                        className="text-[10px]"
                      >
                        {row.category?.toUpperCase().slice(0, 3) || 'OTH'}
                      </CustomBadge>
                      {row.commodity}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatNumber(row.commercialLong)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatNumber(row.commercialShort)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ColoredCell value={row.commercialNet} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {row.percentOILong?.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatNumber(row.nonCommercialLong)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatNumber(row.nonCommercialShort)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ColoredCell value={row.nonCommercialNet} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatNumber(row.openInterest)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ChangeCell value={row.changeOI} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Trading Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-bullish/30 bg-bullish/5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-bullish" />
            <h3 className="font-semibold text-bullish">Most Bullish (Commercial Net Long)</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Commercials are accumulating - follow the smart money</p>
          {filteredData
            .sort((a, b) => b.commercialNet - a.commercialNet)
            .slice(0, 3)
            .map(item => (
              <div key={item.commodity} className="flex justify-between py-2 text-sm border-b border-border/50 last:border-0">
                <span className="font-medium">{item.commodity}</span>
                <span className="font-mono text-bullish">+{formatNumber(item.commercialNet)}</span>
              </div>
            ))}
        </div>
        
        <div className="p-5 rounded-xl border border-bearish/30 bg-bearish/5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-bearish rotate-180" />
            <h3 className="font-semibold text-bearish">Most Bearish (Commercial Net Short)</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Commercials are distributing - potential resistance</p>
          {filteredData
            .sort((a, b) => a.commercialNet - b.commercialNet)
            .slice(0, 3)
            .map(item => (
              <div key={item.commodity} className="flex justify-between py-2 text-sm border-b border-border/50 last:border-0">
                <span className="font-medium">{item.commodity}</span>
                <span className="font-mono text-bearish">{formatNumber(item.commercialNet)}</span>
              </div>
            ))}
        </div>
        
        <div className="p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Largest Position Changes</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Significant weekly changes in commercial positioning</p>
          {filteredData
            .sort((a, b) => Math.abs(b.changeOI) - Math.abs(a.changeOI))
            .slice(0, 3)
            .map(item => (
              <div key={item.commodity} className="flex justify-between py-2 text-sm border-b border-border/50 last:border-0">
                <span className="font-medium">{item.commodity}</span>
                <ChangeCell value={item.changeOI} />
              </div>
            ))}
        </div>
      </div>

      {/* Educational Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          Understanding COT Reports
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-semibold text-bullish mb-2">Commercial Traders (Hedgers)</h4>
            <p className="text-muted-foreground">
              These are the "smart money" - producers and processors who use futures to hedge their business risk. 
              They have intimate knowledge of supply/demand. <strong className="text-foreground">Their extreme positions often mark market turning points.</strong>
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-bearish mb-2">Non-Commercial (Speculators)</h4>
            <p className="text-muted-foreground">
              Large speculators including hedge funds and CTAs. They tend to be trend followers and 
              <strong className="text-foreground"> often wrong at extremes</strong>. Use as a contrarian indicator.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Non-Reportable (Small Traders)</h4>
            <p className="text-muted-foreground">
              Retail traders with positions below reporting thresholds. Historically the 
              <strong className="text-foreground"> least reliable group</strong> - often wrong at market turns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
