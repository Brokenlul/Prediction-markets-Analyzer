import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, TrendingUp, Calendar, Shield, Info } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { useMergedMarkets } from '../hooks/useMergedMarkets';
import { STATS } from '../data/stats';
import { formatPercentage, formatVolume, getCalibrationColor } from '../utils/normalize';
import { LoadingState, ErrorState } from '../components/Skeleton';
import { Market } from '../types';

const FED_KEYWORDS = ['fed', 'fomc', 'rate cut', 'rate hike', 'interest rate', 'cpi', 'inflation', 'powell', 'basis points', 'federal reserve', 'monetary policy', 'treasury', 'yield'];

export function FedMacro() {
  const navigate = useNavigate();
  const { markets, isLoading, isError, refetch } = useMergedMarkets();

  const fedMarkets = useMemo(() => {
    return markets
      .filter(market => {
        const title = market.title.toLowerCase();
        return FED_KEYWORDS.some(kw => title.includes(kw));
      })
      .sort((a, b) => {
        // Sort by end date (soonest first)
        if (a.endDate && b.endDate) {
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        }
        return b.volume24h - a.volume24h;
      });
  }, [markets]);

  // Macro Certainty Score: average of |yes_pct - 50| * 2 across fed markets
  const certaintScore = useMemo(() => {
    if (fedMarkets.length === 0) return 50;
    const sum = fedMarkets.reduce((acc, m) => {
      const certainty = Math.abs(m.yesPrice - 50) * 2;
      return acc + certainty;
    }, 0);
    return Math.min(100, Math.round(sum / fedMarkets.length));
  }, [fedMarkets]);

  const getCertaintyColor = (score: number) => {
    if (score >= 70) return '#22c55e';
    if (score >= 40) return '#eab308';
    return '#ef4444';
  };

  const gaugeData = [{ value: certaintScore, fill: getCertaintyColor(certaintScore) }];

  const calibration = STATS.calibration.Finance;

  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Landmark className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-semibold text-white" data-testid="fed-macro-title">
            Fed Path & Macro Certainty
          </h1>
        </div>
        <p className="text-gray-400 text-sm">
          Federal Reserve and macroeconomic prediction markets • {fedMarkets.length} active markets
        </p>
      </div>

      {/* Loading */}
      {isLoading && <LoadingState message="Loading Fed markets..." />}

      {/* Error */}
      {isError && <ErrorState message="Failed to load market data" onRetry={refetch} />}

      {/* Main Content */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fed Markets List */}
          <div className="lg:col-span-2">
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg overflow-hidden">
              <div className="p-4 border-b border-[#1e1e2e]">
                <h3 className="text-white font-medium">Fed & Macro Markets</h3>
              </div>
              
              {fedMarkets.length > 0 ? (
                <div className="divide-y divide-[#1e1e2e]">
                  {fedMarkets.map(market => (
                    <div
                      key={market.id}
                      onClick={() => navigate('/chart', { state: { market } })}
                      className="p-4 hover:bg-[#161620] cursor-pointer transition-colors"
                      data-testid={`fed-market-${market.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium mb-2 line-clamp-2">
                            {market.title}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            {market.endDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(market.endDate).toLocaleDateString()}
                              </span>
                            )}
                            <span>{formatVolume(market.volume24h)} vol</span>
                            <span className={`px-1.5 py-0.5 rounded ${
                              market.source === 'POLY' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {market.source}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono text-xl font-bold ${
                            market.yesPrice >= 60 ? 'text-green-400' :
                            market.yesPrice <= 40 ? 'text-red-400' : 'text-white'
                          }`}>
                            {formatPercentage(market.yesPrice)}
                          </span>
                          <div className={`text-xs mt-1 ${
                            market.change24h > 0 ? 'text-green-400' :
                            market.change24h < 0 ? 'text-red-400' : 'text-gray-500'
                          }`}>
                            {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(1)}pp 24h
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  No Fed/macro markets found
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Macro Certainty Gauge */}
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-4">
              <h3 className="text-white font-medium mb-4 text-center">Macro Certainty Score</h3>
              <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="100%"
                    data={gaugeData}
                    startAngle={180}
                    endAngle={0}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      angleAxisId={0}
                      tick={false}
                    />
                    <RadialBar
                      background={{ fill: '#1e1e2e' }}
                      dataKey="value"
                      cornerRadius={10}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center -mt-6">
                    <div 
                      className="font-mono text-4xl font-bold"
                      style={{ color: getCertaintyColor(certaintScore) }}
                    >
                      {certaintScore}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">/ 100</div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                {certaintScore >= 70 
                  ? 'High certainty — markets have strong consensus' 
                  : certaintScore >= 40 
                  ? 'Moderate certainty — mixed signals'
                  : 'Low certainty — high uncertainty in rate path'}
              </p>
            </div>

            {/* Finance Calibration Card */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-medium">Finance Category Insight</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Calibration Score</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded border ${getCalibrationColor(calibration.trust_score)}`}>
                    {calibration.trust_score}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Smart Money Gap</span>
                  <span className="font-mono text-green-400">{STATS.smart_money_gap.Finance}pp</span>
                </div>
                <p className="text-xs text-gray-500 pt-2 border-t border-green-500/20">
                  {calibration.note}
                </p>
              </div>
            </div>

            {/* Insight Box */}
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-indigo-400 font-medium mb-2">Why Trust Fed Markets?</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Finance is the most efficient prediction market category.{' '}
                    <span className="text-green-400">99% calibration</span> and{' '}
                    <span className="text-green-400">0.17pp smart money gap</span>.
                    Fed probabilities are the most reliable signals in our {STATS.key_findings.total_trades} trade dataset.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
