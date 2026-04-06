import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingUp, Shield, Skull } from 'lucide-react';
import { useMergedMarkets } from '../hooks/useMergedMarkets';
import { STATS, getLongshotBias } from '../data/stats';
import { formatPercentage, getCalibrationColor } from '../utils/normalize';
import { LoadingState, ErrorState } from '../components/Skeleton';
import { Market } from '../types';

interface TailRiskMarket extends Market {
  relativeChange: number;
  longshotBias: { implied: number; actual: number; bias: number } | null;
}

export function TailRisk() {
  const navigate = useNavigate();
  const { markets, isLoading, isError, refetch } = useMergedMarkets();

  const tailRiskMarkets = useMemo(() => {
    const tailMarkets: TailRiskMarket[] = [];
    
    for (const market of markets) {
      if (market.yesPrice < 20) {
        // Simulate 30d ago price (in real implementation, fetch from history)
        const change = market.change24h;
        const price30dAgo = Math.max(1, market.yesPrice - change * 3); // Rough estimate
        const relativeChange = price30dAgo > 0 ? ((market.yesPrice - price30dAgo) / price30dAgo) * 100 : 0;
        
        tailMarkets.push({
          ...market,
          relativeChange,
          longshotBias: getLongshotBias(market.yesPrice)
        });
      }
    }
    
    // Sort by relative change descending (biggest spikes first)
    tailMarkets.sort((a, b) => b.relativeChange - a.relativeChange);
    
    return tailMarkets;
  }, [markets]);

  const getSpikeColor = (change: number) => {
    if (change >= 50) return 'text-red-400';
    if (change >= 20) return 'text-orange-400';
    if (change > 0) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getCardBorder = (change: number) => {
    if (change >= 50) return 'border-l-red-500';
    if (change >= 20) return 'border-l-orange-500';
    if (change > 0) return 'border-l-yellow-500';
    return 'border-l-gray-600';
  };

  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Skull className="w-6 h-6 text-red-400" />
          <h1 className="text-2xl font-semibold text-white" data-testid="tail-risk-title">
            Tail Risk Monitor
          </h1>
        </div>
        <p className="text-gray-400 text-sm">
          Low probability events ({`<`}20%) with unusual price movement • {tailRiskMarkets.length} tail risk markets
        </p>
      </div>

      {/* Key Insight */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-orange-400 font-medium mb-1">Longshot Bias Alert</p>
            <p className="text-sm text-gray-400">
              Based on {STATS.key_findings.total_trades} trades: contracts priced at 5% historically resolve YES only 
              <span className="font-mono text-orange-300"> 3.8%</span> of the time vs the implied 5%. 
              The systematic mispricing means tail risk buyers often overpay.
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && <LoadingState message="Scanning tail risk markets..." />}

      {/* Error */}
      {isError && <ErrorState message="Failed to load market data" onRetry={refetch} />}

      {/* Markets Grid */}
      {!isLoading && !isError && (
        <>
          {tailRiskMarkets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="tail-risk-grid">
              {tailRiskMarkets.map(market => {
                const calibration = STATS.calibration[market.category] || STATS.calibration.Default;
                const smartMoneyGap = STATS.smart_money_gap[market.category] || STATS.smart_money_gap.Default;
                
                return (
                  <div
                    key={market.id}
                    onClick={() => navigate('/chart', { state: { market } })}
                    className={`
                      bg-[#111118] border border-[#1e1e2e] border-l-4 ${getCardBorder(market.relativeChange)}
                      rounded-lg p-4 cursor-pointer transition-all hover:bg-[#161620]
                    `}
                    data-testid={`tail-risk-card-${market.id}`}
                  >
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500 uppercase">{market.category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        market.source === 'POLY' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {market.source}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-medium mb-3 leading-tight line-clamp-2">
                      {market.title}
                    </h3>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-gray-500">Current: </span>
                        <span className="font-mono font-bold text-red-400">
                          {formatPercentage(market.yesPrice)}
                        </span>
                      </div>
                      <div className="text-gray-600">|</div>
                      <div>
                        <span className="text-gray-500">Spike: </span>
                        <span className={`font-mono font-bold ${getSpikeColor(market.relativeChange)}`}>
                          {market.relativeChange >= 0 ? '+' : ''}{market.relativeChange.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Longshot Bias Warning */}
                    {market.longshotBias && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded p-3 mb-3">
                        <div className="text-xs text-orange-400 font-medium mb-1">LONGSHOT BIAS WARNING</div>
                        <p className="text-xs text-gray-300">
                          Historical: contracts at {market.longshotBias.implied}% implied win only{' '}
                          <span className="font-mono text-orange-300">{market.longshotBias.actual}%</span>.
                          <span className="text-gray-500 ml-1">({market.longshotBias.bias}% mispricing)</span>
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1e1e2e]">
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-gray-500" />
                        <span className={`px-1.5 py-0.5 rounded border ${getCalibrationColor(calibration.trust_score)}`}>
                          {calibration.trust_score}%
                        </span>
                      </div>
                      <div className="text-gray-500">
                        Gap: <span className="font-mono">{smartMoneyGap.toFixed(2)}pp</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-12 text-center">
              <Skull className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <div className="text-gray-400 text-lg mb-2">No Tail Risk Events</div>
              <div className="text-gray-500 text-sm">
                No markets currently priced below 20%. All events have moderate to high probability.
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer Stats */}
      <div className="mt-8 bg-[#111118] border border-[#1e1e2e] rounded-lg p-4">
        <h3 className="text-white text-sm font-medium mb-3">Longshot Bias Table (from 72.1M trades)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {STATS.longshot_bias.map((bucket, index) => (
            <div key={index} className="text-center bg-[#0a0a0f] rounded p-2">
              <div className="text-xs text-gray-500 mb-1">{bucket.range}</div>
              <div className="font-mono text-sm">
                <span className="text-gray-400">{bucket.implied}%</span>
                <span className="text-gray-600 mx-1">→</span>
                <span className={bucket.bias < 0 ? 'text-red-400' : 'text-green-400'}>
                  {bucket.actual}%
                </span>
              </div>
              <div className={`text-xs font-mono ${bucket.bias < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {bucket.bias > 0 ? '+' : ''}{bucket.bias}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
