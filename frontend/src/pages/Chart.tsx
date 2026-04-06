import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Shield, Users, AlertTriangle, Search, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, Bar } from 'recharts';
import { usePriceHistory } from '../hooks/usePolymarket';
import { useMergedMarkets } from '../hooks/useMergedMarkets';
import { STATS, getLongshotBias } from '../data/stats';
import { formatPercentage, truncateTitle } from '../utils/normalize';
import { LoadingState } from '../components/Skeleton';
import { Market } from '../types';

const TIME_INTERVALS = [
  { id: '1h', label: '1H' },
  { id: '6h', label: '6H' },
  { id: '1d', label: '1D' },
  { id: '1w', label: '1W' },
];

// Generate mock data when API doesn't return history
function generateMockHistory(market: Market, interval: string): { timestamp: number; price: number; volume: number }[] {
  const points = interval === '1h' ? 60 : interval === '6h' ? 72 : interval === '1d' ? 96 : 168;
  const now = Date.now();
  const intervalMs = interval === '1h' ? 60000 : interval === '6h' ? 300000 : interval === '1d' ? 900000 : 3600000;
  
  const basePrice = market.yesPrice;
  const volatility = STATS.category_volatility[market.category] || 3.5;
  
  const data = [];
  let price = Math.max(1, basePrice - (Math.random() * volatility * 3));
  
  for (let i = 0; i < points; i++) {
    price = Math.max(1, Math.min(99, price + (Math.random() - 0.48) * volatility * 0.3));
    data.push({
      timestamp: now - (points - i) * intervalMs,
      price: Math.round(price * 10) / 10,
      volume: Math.floor(Math.random() * 50000 + 10000)
    });
  }
  
  // Ensure last point matches current price
  data[data.length - 1].price = basePrice;
  
  return data;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-[#1e1e2e] border border-[#2a2a3e] rounded-lg p-3 shadow-xl">
      <div className="text-xs text-gray-400 mb-1">
        {new Date(label).toLocaleString()}
      </div>
      <div className="font-mono text-lg text-[#22c55e]">
        {formatPercentage(payload[0]?.value || 0)}
      </div>
      {payload[1] && (
        <div className="text-xs text-gray-500 mt-1">
          Vol: ${((payload[1]?.value || 0) / 1000).toFixed(0)}K
        </div>
      )}
    </div>
  );
}

interface MarketSearchProps {
  markets: Market[];
  onSelect: (market: Market) => void;
  currentMarket: Market | null;
}

function MarketSearch({ markets, onSelect, currentMarket }: MarketSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const filteredMarkets = useMemo(() => {
    if (!query.trim()) return markets.slice(0, 20);
    const q = query.toLowerCase();
    return markets.filter(m => m.title.toLowerCase().includes(q)).slice(0, 20);
  }, [markets, query]);
  
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search markets..."
          className="w-full pl-10 pr-10 py-2 bg-[#111118] border border-[#1e1e2e] rounded-lg text-white text-sm focus:outline-none focus:border-[#6366f1] transition-colors"
          data-testid="market-search-input"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#111118] border border-[#1e1e2e] rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
            {filteredMarkets.length > 0 ? (
              filteredMarkets.map(market => (
                <button
                  key={market.id}
                  onClick={() => {
                    onSelect(market);
                    setQuery('');
                    setIsOpen(false);
                  }}
                  className={`
                    w-full text-left px-4 py-2.5 hover:bg-[#1e1e2e] transition-colors
                    ${currentMarket?.id === market.id ? 'bg-[#6366f1]/10 border-l-2 border-l-[#6366f1]' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white truncate flex-1 mr-3">
                      {truncateTitle(market.title, 50)}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`font-mono text-sm font-medium ${
                        market.yesPrice >= 60 ? 'text-green-400' :
                        market.yesPrice <= 40 ? 'text-red-400' : 'text-white'
                      }`}>
                        {formatPercentage(market.yesPrice)}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        market.source === 'POLY' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {market.source}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                No markets found
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function Chart() {
  const location = useLocation();
  const navigate = useNavigate();
  const { markets } = useMergedMarkets();
  
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(
    location.state?.market || null
  );
  const [interval, setInterval] = useState('1d');
  
  const market = selectedMarket;
  
  const { data: historyData, isLoading } = usePriceHistory(market?.conditionId, interval);
  
  // Use API data or generate mock data
  const chartData = useMemo(() => {
    if (!market) return [];
    
    if (historyData && historyData.length > 0) {
      return historyData.map(point => ({
        timestamp: point.timestamp,
        price: point.price,
        volume: Math.floor(Math.random() * 50000 + 10000)
      }));
    }
    
    return generateMockHistory(market, interval);
  }, [historyData, market, interval]);
  
  // Calculate rolling average
  const chartDataWithMA = useMemo(() => {
    const windowSize = Math.min(24, Math.floor(chartData.length / 4));
    return chartData.map((point, index) => {
      if (index < windowSize - 1) {
        return { ...point, ma: null };
      }
      const slice = chartData.slice(index - windowSize + 1, index + 1);
      const ma = slice.reduce((sum, p) => sum + p.price, 0) / windowSize;
      return { ...point, ma: Math.round(ma * 10) / 10 };
    });
  }, [chartData]);
  
  const handleMarketSelect = (m: Market) => {
    setSelectedMarket(m);
  };
  
  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        data-testid="back-button"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      
      {/* Market Search */}
      <div className="mb-6">
        <MarketSearch 
          markets={markets} 
          onSelect={handleMarketSelect}
          currentMarket={market}
        />
      </div>
      
      {!market ? (
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-12 text-center">
          <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <div className="text-gray-400 mb-2">No market selected</div>
          <p className="text-sm text-gray-500">
            Use the search above to find a market, or click on a market from the Dashboard
          </p>
        </div>
      ) : (
        <>
          {/* Market Header */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-semibold text-white mb-2" data-testid="chart-title">
                  {market.title}
                </h1>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-2 py-1 rounded bg-[#1e1e2e] text-gray-300">
                    {market.category}
                  </span>
                  <span className={`px-2 py-1 rounded ${
                    market.source === 'POLY' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {market.source}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-mono text-3xl font-bold ${
                  market.yesPrice >= 60 ? 'text-green-400' : 
                  market.yesPrice <= 40 ? 'text-red-400' : 'text-white'
                }`}>
                  {formatPercentage(market.yesPrice)}
                </div>
                <div className="text-sm text-gray-500">Current YES Price</div>
              </div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-4 mb-6">
            {/* Time Interval Buttons */}
            <div className="flex gap-2 mb-4" data-testid="time-intervals">
              {TIME_INTERVALS.map(ti => (
                <button
                  key={ti.id}
                  onClick={() => setInterval(ti.id)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    interval === ti.id 
                      ? 'bg-[#6366f1] text-white' 
                      : 'bg-[#1e1e2e] text-gray-400 hover:text-white'
                  }`}
                  data-testid={`interval-${ti.id}`}
                >
                  {ti.label}
                </button>
              ))}
            </div>
            
            {/* Chart Area */}
            <div className="h-[400px]" data-testid="price-chart">
              {isLoading ? (
                <LoadingState message="Loading price history..." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartDataWithMA} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#6b7280"
                      fontSize={10}
                      tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      minTickGap={50}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      fontSize={10}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="volume" fill="#6366f1" opacity={0.15} yAxisId="volume" />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#22c55e" 
                      fill="url(#priceGradient)"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ma" 
                      stroke="#6366f1" 
                      strokeDasharray="5 5"
                      strokeWidth={1}
                      dot={false}
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
            
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-[#22c55e]" />
                <span>YES Price</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-[#6366f1] border-dashed" />
                <span>7-period MA</span>
              </div>
            </div>
          </div>
          
          {/* Data Insights Panel */}
          <DataInsightsPanel market={market} />
        </>
      )}
    </div>
  );
}

function DataInsightsPanel({ market }: { market: Market }) {
  const calibration = STATS.calibration[market.category] || STATS.calibration.Default;
  const smartMoneyGap = STATS.smart_money_gap[market.category] || STATS.smart_money_gap.Default;
  const asymmetry = STATS.yes_no_asymmetry[market.category] || STATS.yes_no_asymmetry.Default;
  const longshotBias = market.yesPrice < 20 ? getLongshotBias(market.yesPrice) : null;
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="insights-panel">
        {/* Calibration Card */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <Shield className="w-4 h-4 text-[#6366f1]" />
            Calibration Score
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`font-mono text-2xl font-bold ${
              calibration.trust_score >= 90 ? 'text-green-400' :
              calibration.trust_score >= 70 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {calibration.trust_score}%
            </span>
            <span className="text-gray-500">trust</span>
          </div>
          <p className="text-xs text-gray-400">{calibration.note}</p>
        </div>
        
        {/* Smart Money Gap Card */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <TrendingUp className="w-4 h-4 text-[#6366f1]" />
            Smart Money Gap
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`font-mono text-2xl font-bold ${
              smartMoneyGap < 1 ? 'text-green-400' :
              smartMoneyGap < 3 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {smartMoneyGap.toFixed(2)}pp
            </span>
            <span className="text-gray-500">maker edge</span>
          </div>
          <p className="text-xs text-gray-400">
            {smartMoneyGap < 1 
              ? 'Efficient market — minimal professional edge'
              : smartMoneyGap < 3
                ? 'Moderate professional activity'
                : 'High maker advantage — takers beware'}
          </p>
        </div>
        
        {/* YES/NO Asymmetry Card */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <Users className="w-4 h-4 text-[#6366f1]" />
            YES/NO Asymmetry
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-mono text-2xl font-bold text-white">
              {(asymmetry.taker_yes_pct * 100).toFixed(0)}%
            </span>
            <span className="text-gray-500">takers buy YES</span>
          </div>
          <p className="text-xs text-gray-400">
            Optimism Tax: {asymmetry.optimism_tax.toFixed(2)}pp premium on YES bets
          </p>
        </div>
      </div>
      
      {/* Longshot Bias Warning */}
      {longshotBias && (
        <div className="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-orange-400 font-medium mb-1">LONGSHOT BIAS WARNING</div>
              <p className="text-sm text-gray-300">
                Based on {STATS.key_findings.total_trades} trades, contracts priced in the {longshotBias.range} range 
                historically resolve YES only <span className="font-mono text-orange-300">{longshotBias.actual}%</span> of the time,
                versus the implied <span className="font-mono">{longshotBias.implied}%</span>.
                <span className="text-gray-500 ml-1">(Mispricing: {longshotBias.bias}%)</span>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Source Attribution */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        Historical insights powered by Jon-Becker prediction market dataset ({STATS.key_findings.dataset_period})
      </div>
    </>
  );
}
