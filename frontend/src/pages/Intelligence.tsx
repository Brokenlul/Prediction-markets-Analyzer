import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, TrendingUp, TrendingDown, BarChart3, AlertTriangle, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, ComposedChart, Cell } from 'recharts';
import { useMergedMarkets } from '../hooks/useMergedMarkets';
import { STATS } from '../data/stats';
import { formatPercentage } from '../utils/normalize';
import { LoadingState, ErrorState } from '../components/Skeleton';
import { Market } from '../types';

export function Intelligence() {
  const navigate = useNavigate();
  const { markets, isLoading, isError, refetch } = useMergedMarkets();
  const [activeTab, setActiveTab] = useState<'rising' | 'falling'>('rising');

  // Narrative Momentum: based on 24h change (in real app, would use 7-day history)
  const momentumMarkets = useMemo(() => {
    const withMomentum = markets.map(m => ({
      ...m,
      momentum: m.change24h // In real implementation: change_24h * 0.5 + change_72h * 0.3 + change_168h * 0.2
    }));
    
    return withMomentum.sort((a, b) => {
      if (activeTab === 'rising') {
        return b.momentum - a.momentum;
      }
      return a.momentum - b.momentum;
    }).slice(0, 20);
  }, [markets, activeTab]);

  // Smart Money Gap data for chart
  const smartMoneyData = useMemo(() => {
    return Object.entries(STATS.smart_money_gap)
      .filter(([k]) => k !== 'Default')
      .map(([category, gap]) => ({
        category: category.length > 10 ? category.substring(0, 10) + '...' : category,
        fullCategory: category,
        gap,
        fill: gap < 1 ? '#22c55e' : gap < 3 ? '#eab308' : gap < 5 ? '#f97316' : '#ef4444'
      }))
      .sort((a, b) => a.gap - b.gap);
  }, []);

  // Longshot bias data for chart
  const longshotData = useMemo(() => {
    return STATS.longshot_bias.map(b => ({
      range: b.range,
      implied: b.implied,
      actual: b.actual,
      bias: b.bias
    }));
  }, []);

  // YES/NO returns data
  const yesNoData = [
    { name: 'YES Buyers', value: STATS.key_findings.yes_buyer_return, fill: '#ef4444' },
    { name: 'NO Buyers', value: STATS.key_findings.no_buyer_return, fill: '#22c55e' }
  ];

  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-semibold text-white" data-testid="intelligence-title">
            Market Intelligence
          </h1>
        </div>
        <p className="text-gray-400 text-sm">
          Narrative momentum, optimism tax, and smart money insights from {STATS.key_findings.total_trades} trades
        </p>
      </div>

      {/* Loading */}
      {isLoading && <LoadingState message="Loading intelligence data..." />}

      {/* Error */}
      {isError && <ErrorState message="Failed to load market data" onRetry={refetch} />}

      {/* Main Content */}
      {!isLoading && !isError && (
        <>
          {/* Narrative Momentum Leaderboard */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg mb-6">
            <div className="p-4 border-b border-[#1e1e2e] flex items-center justify-between">
              <h3 className="text-white font-medium">Narrative Momentum Leaderboard</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('rising')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                    activeTab === 'rising' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  data-testid="tab-rising"
                >
                  <TrendingUp className="w-4 h-4" />
                  Rising
                </button>
                <button
                  onClick={() => setActiveTab('falling')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                    activeTab === 'falling' 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  data-testid="tab-falling"
                >
                  <TrendingDown className="w-4 h-4" />
                  Falling
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-[#1e1e2e] max-h-[400px] overflow-y-auto">
              {momentumMarkets.map((market, index) => (
                <div
                  key={market.id}
                  onClick={() => navigate('/chart', { state: { market } })}
                  className="p-3 hover:bg-[#161620] cursor-pointer transition-colors flex items-center gap-4"
                >
                  <span className="text-gray-500 font-mono text-sm w-6">
                    #{index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{market.title}</p>
                    <span className="text-xs text-gray-500">{market.category}</span>
                  </div>
                  <span className={`font-mono text-sm font-medium ${
                    market.momentum > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {market.momentum >= 0 ? '+' : ''}{market.momentum.toFixed(1)}pp
                  </span>
                  <span className={`font-mono font-bold ${
                    market.yesPrice >= 60 ? 'text-green-400' :
                    market.yesPrice <= 40 ? 'text-red-400' : 'text-white'
                  }`}>
                    {formatPercentage(market.yesPrice)}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    market.source === 'POLY' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {market.source}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Three Insight Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: The Optimism Tax */}
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-red-400" />
                <h3 className="text-white font-medium">The Optimism Tax</h3>
              </div>
              
              <div className="h-40 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yesNoData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" horizontal={false} />
                    <XAxis type="number" domain={[-2, 1]} stroke="#6b7280" fontSize={10} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={11} width={80} />
                    <Tooltip 
                      contentStyle={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 6 }}
                      formatter={(v: number) => [`${v.toFixed(2)}%`, 'Return']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {yesNoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-center mb-3">
                <span className="text-2xl font-mono font-bold text-yellow-400">
                  {STATS.key_findings.optimism_tax.toFixed(2)}pp
                </span>
                <span className="text-gray-500 ml-2">Optimism Tax</span>
              </div>

              <p className="text-xs text-gray-500 text-center">
                YES buyers lose {Math.abs(STATS.key_findings.yes_buyer_return)}% per trade on average.
                NO buyers earn +{STATS.key_findings.no_buyer_return}%.
                <br />
                Source: {STATS.key_findings.total_trades} trades, {STATS.key_findings.total_volume} volume
              </p>
            </div>

            {/* Card 2: Smart Money Gap */}
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-white font-medium">Smart Money Gap by Category</h3>
              </div>
              
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={smartMoneyData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" horizontal={false} />
                    <XAxis type="number" domain={[0, 8]} stroke="#6b7280" fontSize={10} tickFormatter={v => `${v}pp`} />
                    <YAxis type="category" dataKey="category" stroke="#6b7280" fontSize={10} width={75} />
                    <Tooltip 
                      contentStyle={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 6 }}
                      formatter={(v: number, _n, p) => [`${v.toFixed(2)}pp`, p.payload.fullCategory]}
                    />
                    <Bar dataKey="gap" radius={[0, 4, 4, 0]}>
                      {smartMoneyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-gray-500 text-center mt-2">
                <span className="text-green-400">Finance: 0.17pp</span> — nearly no edge for pros.
                <br />
                <span className="text-red-400">World Events: 7.32pp</span> — maximum extraction.
              </p>
            </div>

            {/* Card 3: Longshot Trap */}
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <h3 className="text-white font-medium">The Longshot Trap</h3>
              </div>
              
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={longshotData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                    <XAxis dataKey="range" stroke="#6b7280" fontSize={9} angle={-45} textAnchor="end" height={50} />
                    <YAxis stroke="#6b7280" fontSize={10} tickFormatter={v => `${v}%`} />
                    <Tooltip 
                      contentStyle={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 6 }}
                      formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="implied" 
                      fill="#6b728020" 
                      stroke="#6b7280"
                      strokeDasharray="5 5"
                      name="Implied"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', r: 3 }}
                      name="Actual"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-gray-500 text-center mt-2">
                Contracts priced at 5% win only <span className="text-orange-400">3.8%</span> of the time.
                <br />
                Longshot bias = systematic mispricing of low-prob events.
              </p>
            </div>
          </div>

          {/* Key Takeaway */}
          <div className="mt-6 bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-indigo-400 font-medium mb-2">Key Intelligence Takeaway</p>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Trade Finance markets.</strong> They have near-perfect calibration (99%) and minimal smart money edge (0.17pp).
                  <br />
                  <strong className="text-white">Avoid World Events and Entertainment as a taker.</strong> You're playing against professional algorithms with 5-7pp systematic advantages.
                  <br />
                  <strong className="text-white">Fade longshots.</strong> The "Optimism Tax" means YES buyers systematically overpay for affirmative outcomes.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
