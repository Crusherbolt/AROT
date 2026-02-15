import { useState, useEffect } from 'react';
import { useCOTData, COTRecord } from '@/hooks/useCOTData';
import { useGammaData } from '@/hooks/useGammaData';
import { useETFFlowData } from '@/hooks/useETFFlowData';
import { AIForecast } from '@/components/dashboard/AIForecast';
import { CustomBadge } from '@/components/ui/custom-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, ArrowUpDown, Download, Filter, TrendingUp, Users, Info, ChevronRight, ArrowUp, ArrowDown, Calendar, Activity } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useSearchParams, Link } from 'react-router-dom';
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

// Commodity to ETF mapping (Real-time data fetched via hooks)
const commodityETFMap: Record<string, { etf: string; name: string }> = {
  'GOLD': { etf: 'GLD', name: 'SPDR Gold Shares' },
  'SILVER': { etf: 'SLV', name: 'iShares Silver Trust' },
  'CRUDE OIL': { etf: 'USO', name: 'United States Oil Fund' },
  'NATURAL GAS': { etf: 'UNG', name: 'United States Natural Gas Fund' },
  'COPPER': { etf: 'CPER', name: 'United States Copper Index Fund' },
  'CORN': { etf: 'CORN', name: 'Teucrium Corn Fund' },
  'WHEAT': { etf: 'WEAT', name: 'Teucrium Wheat Fund' },
  'SOYBEANS': { etf: 'SOYB', name: 'Teucrium Soybean Fund' },
  'S&P 500': { etf: 'SPY', name: 'SPDR S&P 500 ETF' },
  'E-MINI S&P 500': { etf: 'SPY', name: 'SPDR S&P 500 ETF' },
  'NASDAQ 100': { etf: 'QQQ', name: 'Invesco QQQ Trust' },
  'E-MINI NASDAQ': { etf: 'QQQ', name: 'Invesco QQQ Trust' },
  'RUSSELL 2000': { etf: 'IWM', name: 'iShares Russell 2000 ETF' },
  'DOW JONES': { etf: 'DIA', name: 'SPDR Dow Jones Industrial' },
  '10Y TREASURY': { etf: 'IEF', name: 'iShares 7-10 Year Treasury Bond ETF' },
  'EUR/USD': { etf: 'FXE', name: 'Invesco CurrencyShares Euro Trust' },
};

type SortField = 'commodity' | 'commercialNet' | 'nonCommercialNet' | 'openInterest' | 'changeOI';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'summary' | 'detailed';

export default function COTReports() {
  const { data, historical, loading, lastUpdate, refetch } = useCOTData();
  const { data: gammaData, loading: gammaLoading, fetchGammaData } = useGammaData();
  const { data: etfFlowData, loading: flowLoading, fetchETFFlowData } = useETFFlowData();
  
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('commodity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [category, setCategory] = useState<'all' | 'forex' | 'commodities' | 'indices' | 'bonds'>('all');
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('summary');

  const formatNumber = (num: number, showSign = false) => {
    const sign = showSign && num > 0 ? '+' : '';
    const absNum = Math.abs(num);
    if (absNum >= 1000000) {
      return sign + (num / 1000000).toFixed(2) + 'M';
    }
    if (absNum >= 1000) {
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
        const bValStr = bVal as string;
        return aVal.localeCompare(bValStr) * multiplier;
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

  useEffect(() => {
    if (selectedCommodity) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCommodity]);

  const selectedHistory = selectedCommodity ? historical[selectedCommodity] || [] : [];
  
  useEffect(() => {
    const commodity = selectedHistory[0]?.commodity?.toUpperCase();
    if (commodity && commodityETFMap[commodity]) {
       const etf = commodityETFMap[commodity].etf;
       fetchGammaData(etf, ''); 
       fetchETFFlowData(etf);
    }
  }, [selectedHistory, fetchGammaData, fetchETFFlowData]);
  
  const filteredHistory = selectedHistory.filter(item => {
    const date = new Date(item.date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    switch (timeFrame) {
      case '1M': return diffDays <= 35;
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

  const getTrendAnalysis = () => {
    if (filteredHistory.length < 2) return { trend: 'NEUTRAL', color: 'muted' };
    const latest = filteredHistory[0];
    const prev = filteredHistory[Math.min(4, filteredHistory.length - 1)];
    const commNetChange = latest.commercialNet - prev.commercialNet;
    
    if (commNetChange > 0 && latest.commercialNet > 0) return { trend: 'BUILDING LONG', color: 'bullish' };
    if (commNetChange < 0 && latest.commercialNet < 0) return { trend: 'BUILDING SHORT', color: 'bearish' };
    if (commNetChange > 0 && latest.commercialNet < 0) return { trend: 'COVERING SHORTS', color: 'bullish' };
    if (commNetChange < 0 && latest.commercialNet > 0) return { trend: 'LIQUIDATING LONGS', color: 'bearish' };
    
    return { trend: 'NEUTRAL', color: 'muted' };
  };

  const trend = getTrendAnalysis();
  const isCinematicCommodity = selectedHistory[0]?.commodity?.toUpperCase() === 'CRUDE OIL';

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
    const intensity = Math.min(Math.abs(value) / (isPercent ? 50 : 100000), 1);
    const isPositive = value >= 0;
    
    return (
      <div 
        className={`px-2 py-1 rounded font-mono text-sm text-center ${
          isPositive ? 'bg-bullish/20 text-bullish' : 'bg-bearish/20 text-bearish'
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
    <div className="space-y-6 animate-fade-up px-4 md:px-6 lg:px-8 max-w-[2000px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">COT Reports</h1>
          <p className="text-muted-foreground mt-1">
            Commitment of Traders - Professional Market Data Analysis
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant={viewMode === 'summary' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('summary')}>
            Summary
          </Button>
          <Button variant={viewMode === 'detailed' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('detailed')}>
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

      {/* Banner */}
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
              Commercial traders (hedgers) are typically producers and consumers. They understand supply/demand best. Extreme net long positions often signal market bottoms.
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-bullish"></div>
                <span>Commercial Net Long = Bullish</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-bearish"></div>
                <span>Commercial Net Short = Bearish</span>
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

      {selectedCommodity && selectedHistory.length > 0 ? (
        <div className={`rounded-xl border p-6 space-y-6 animate-fade-up ${
          isCinematicCommodity 
            ? 'border-amber-500/30 bg-gradient-to-br from-black via-neutral-900 to-black text-white' 
            : 'border-border bg-card'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${isCinematicCommodity ? 'text-amber-500' : ''}`}>
                {selectedHistory[0]?.commodity} Detailed COT Report
              </h2>
              <p className={`text-sm mt-1 ${isCinematicCommodity ? 'text-neutral-400' : 'text-muted-foreground'}`}>
                Historical positioning data • {selectedHistory.length} weeks of data
              </p>
            </div>
            <Button 
              variant={isCinematicCommodity ? 'ghost' : 'outline'} 
              size="sm" 
              onClick={() => setSelectedCommodity(null)}
              className={isCinematicCommodity ? 'text-amber-500 hover:text-amber-400 border-amber-500/30' : ''}
            >
              Close Detail View
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-border">
              {(['1M', '3M', '6M', '1Y'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFrame(tf)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    timeFrame === tf ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
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
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => formatNumber(value)} />
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="commercialNet" name="Commercial Net" stroke="hsl(var(--bullish))" fill="url(#commGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="nonCommercialNet" name="Non-Commercial Net" stroke="hsl(var(--bearish))" fill="url(#nonCommGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Related ETF Gamma Section */}
          {selectedHistory[0]?.commodity && commodityETFMap[selectedHistory[0].commodity.toUpperCase()] && (
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between mb-4">
                <Link 
                  to={`/gamma?ticker=${commodityETFMap[selectedHistory[0].commodity.toUpperCase()].etf}`}
                  className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
                >
                  <Activity className="h-5 w-5 text-primary group-hover:animate-pulse" />
                  <h3 className="font-semibold group-hover:underline">Related ETF Gamma Exposure</h3>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link to={`/gamma?ticker=${commodityETFMap[selectedHistory[0].commodity.toUpperCase()].etf}`}>
                  <CustomBadge variant="bullish" className="font-mono hover:bg-bullish/30 cursor-pointer">
                    {commodityETFMap[selectedHistory[0].commodity.toUpperCase()].etf}
                  </CustomBadge>
                </Link>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {commodityETFMap[selectedHistory[0].commodity.toUpperCase()].name} - Real-Time Data
              </p>
              
              {gammaLoading ? (
                <div className="text-center py-4 text-sm text-muted-foreground">Loading Real-Time Gamma...</div>
              ) : gammaData ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-surface">
                    <p className="text-xs text-muted-foreground mb-1">Net Gamma</p>
                    <p className={`font-mono font-bold ${gammaData.netGamma >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                      {formatNumber(gammaData.netGamma, true)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface">
                    <p className="text-xs text-muted-foreground mb-1">Spot Price</p>
                    <p className="font-mono font-bold">${gammaData.spotPrice.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface">
                    <p className="text-xs text-muted-foreground mb-1">Put Wall</p>
                    <p className="font-mono font-bold text-bullish">${gammaData.putWall.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface">
                    <p className="text-xs text-muted-foreground mb-1">Call Wall</p>
                    <p className="font-mono font-bold text-bearish">${gammaData.callWall.toFixed(2)}</p>
                  </div>
                </div>
              ) : null}

              {etfFlowData && (
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
                   <div>
                      <p className="text-xs text-muted-foreground">ETF Flow Trend (30D)</p>
                       <CustomBadge variant={etfFlowData.flowTrend === 'neutral' ? 'muted' : etfFlowData.flowTrend} className="mt-1">
                          {etfFlowData.flowTrend.toUpperCase()}
                       </CustomBadge>
                   </div>
                   <div>
                       <p className="text-xs text-muted-foreground">Net Flow (Latest)</p>
                       <p className={`font-mono font-bold ${etfFlowData.netFlow >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                         {formatNumber(etfFlowData.netFlow * 1000000, true)}
                       </p>
                   </div>
                </div>
              )}
            </div>
          )}

          {selectedHistory[0]?.commodity && <AIForecast commodity={selectedHistory[0].commodity} />}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold sticky left-0 bg-muted/50">Date</TableHead>
                  <TableHead colSpan={4} className="text-center font-semibold bg-bullish/5">COMMERCIAL</TableHead>
                  <TableHead colSpan={4} className="text-center font-semibold bg-bearish/5">NON-COMM</TableHead>
                  <TableHead className="text-right font-semibold">OI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((row, idx) => (
                  <TableRow key={row.date} className={idx === 0 ? 'bg-primary/5' : ''}>
                    <TableCell className="font-medium sticky left-0 bg-card">{format(new Date(row.date), 'd MMM yyyy')}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatNumber(row.commercialLong)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatNumber(row.commercialShort)}</TableCell>
                    <TableCell className="text-right"><ChangeCell value={row.commChangeLong} /></TableCell>
                    <TableCell className="text-right"><ColoredCell value={row.commercialNet} /></TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatNumber(row.nonCommercialLong)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatNumber(row.nonCommercialShort)}</TableCell>
                    <TableCell className="text-right"><ChangeCell value={row.nonCommChangeLong} /></TableCell>
                    <TableCell className="text-right"><ColoredCell value={row.nonCommercialNet} /></TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatNumber(row.openInterest)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead><SortButton field="commodity">Instrument</SortButton></TableHead>
                  <TableHead className="text-right">Comm Long</TableHead>
                  <TableHead className="text-right">Comm Short</TableHead>
                  <TableHead className="text-right"><SortButton field="commercialNet">Comm Net</SortButton></TableHead>
                  <TableHead className="text-right">% OI Long</TableHead>
                  <TableHead className="text-right">Non-Comm Net</TableHead>
                  <TableHead className="text-right"><SortButton field="openInterest">OI</SortButton></TableHead>
                  <TableHead className="text-right"><SortButton field="changeOI">Δ OI</SortButton></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row) => (
                  <TableRow key={row.commodity} className="cursor-pointer hover:bg-surface-hover" onClick={() => setSelectedCommodity(row.code)}>
                    <TableCell className="font-medium">{row.commodity}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatNumber(row.commercialLong)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatNumber(row.commercialShort)}</TableCell>
                    <TableCell className="text-right"><ColoredCell value={row.commercialNet} /></TableCell>
                    <TableCell className="text-right font-mono text-sm">{row.percentOILong?.toFixed(1)}%</TableCell>
                    <TableCell className="text-right"><ColoredCell value={row.nonCommercialNet} /></TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatNumber(row.openInterest)}</TableCell>
                    <TableCell className="text-right"><ChangeCell value={row.changeOI} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Strategies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-bullish/30 bg-bullish/5">
          <h3 className="font-semibold text-bullish mb-3">Most Bullish</h3>
          {filteredData.sort((a, b) => b.commercialNet - a.commercialNet).slice(0, 3).map(item => (
            <div key={item.commodity} className="flex justify-between py-2 border-b border-border/50 last:border-0">
              <span className="font-medium">{item.commodity}</span>
              <span className="font-mono text-bullish">+{formatNumber(item.commercialNet)}</span>
            </div>
          ))}
        </div>
        <div className="p-5 rounded-xl border border-bearish/30 bg-bearish/5">
          <h3 className="font-semibold text-bearish mb-3">Most Bearish</h3>
          {filteredData.sort((a, b) => a.commercialNet - b.commercialNet).slice(0, 3).map(item => (
            <div key={item.commodity} className="flex justify-between py-2 border-b border-border/50 last:border-0">
              <span className="font-medium">{item.commodity}</span>
              <span className="font-mono text-bearish">{formatNumber(item.commercialNet)}</span>
            </div>
          ))}
        </div>
        <div className="p-5 rounded-xl border border-border bg-card">
          <h3 className="font-semibold mb-3">Position Changes</h3>
          {filteredData.sort((a, b) => Math.abs(b.changeOI) - Math.abs(a.changeOI)).slice(0, 3).map(item => (
            <div key={item.commodity} className="flex justify-between py-2 border-b border-border/50 last:border-0">
               <span className="font-medium">{item.commodity}</span>
               <ChangeCell value={item.changeOI} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
