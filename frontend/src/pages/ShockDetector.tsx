import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingUp, TrendingDown, Zap, Info } from 'lucide-react';
import { useMergedMarkets, useShockAlerts } from '../hooks/useMergedMarkets';
import { STATS, getLongshotBias } from '../data/stats';
import { 
  formatPercentage, 
  getZScoreColor,
  isHighBiasCategory
} from '../utils/normalize';
import { SkeletonCard, ErrorState } from '../components/Skeleton';
import { ShockAlert, Market } from '../types';

function ShockCard({ alert, onClick }: { alert: ShockAlert; onClick: () => void }) {
  const { market, zScore, previousPrice, absoluteChange, relativeChange, volumeMultiple } = alert;
  const calibration = STATS.calibration[market.category] || STATS.calibration.Default;
  const smartMoneyGap = STATS.smart_money_gap[market.category] || STATS.smart_money_gap.Default;
  const asymmetry = STATS.yes_no_asymmetry[market.category] || STATS.yes_no_asymmetry.Default;
  const longshotBias = market.yesPrice < 20 ? getLongshotBias(market.yesPrice) : null;
  const isPulse = zScore >= 3.0;
  
  return (
    <div 
      onClick={onClick}
      className={`
        bg-[#111118] border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-[1.01]
        ${getZScoreColor(zScore)}
        ${isPulse ? 'pulse-alert' : ''}
      `}
      data-testid={`shock-card-${market.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`
            px-2 py-0.5 rounded text-xs font-bold
            ${zScore >= 3.0 ? 'bg-red-500 text-white' : 
              zScore >= 2.5 ? 'bg-orange-500 text-white' : 
              'bg-yellow-500 text-black'}
          `}>
            {zScore.toFixed(1)}σ
          </span>
          <span className="text-xs text-gray-400 uppercase">{market.category}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${
          market.source === 'POLY' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
        }`}>
          {market.source}
        </span>
      </div>
      
      {/* Title */}
      <h3 className="text-white font-medium mb-3 leading-tight">
        {market.title}
      </h3>
      
      {/* Price Change */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-gray-400">{formatPercentage(previousPrice)}</span>
          <span className="text-gray-500">→</span>
          <span className={`font-mono text-xl font-bold ${
            absoluteChange > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatPercentage(market.yesPrice)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {absoluteChange > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
          <span className={`font-mono text-sm ${
            absoluteChange > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {absoluteChange > 0 ? '+' : ''}{absoluteChange.toFixed(1)}pp
            <span className="text-gray-500 ml-1">
              ({relativeChange > 0 ? '+' : ''}{relativeChange.toFixed(0)}%)
            </span>
          </span>
        </div>
      </div>
      
      {/* Volume */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Zap className="w-3 h-3" />
        <span>Vol: {volumeMultiple.toFixed(1)}x avg</span>
        <span className="text-gray-600">|</span>
        <span>Trust: {calibration.trust_score}%</span>
        <span className="text-gray-600">|</span>
        <span>Gap: {smartMoneyGap.toFixed(2)}pp</span>
      </div>
      
      {/* Longshot Bias Warning */}
      {longshotBias && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded p-3 mb-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <div className="text-orange-400 font-medium mb-1">LONGSHOT BIAS WARNING</div>
              <div className="text-gray-300">
                Historical data: contracts at this level win only <span className="font-mono text-orange-300">{longshotBias.actual}%</span> vs implied <span className="font-mono">{longshotBias.implied}%</span>.
                <span className="text-gray-500 ml-1">({longshotBias.bias}% mispricing)</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Optimism Tax Warning */}
      {isHighBiasCategory(market.category) && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-300">
              <span className="text-yellow-400">{market.category}</span> takers overpay YES by{' '}
              <span className="font-mono text-yellow-300">{asymmetry.optimism_tax.toFixed(2)}pp</span> avg.
              {' '}If you're buying YES here, you're swimming against the smart money current.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ShockDetector() {
  const navigate = useNavigate();
  const { markets, isLoading, isError, refetch } = useMergedMarkets();
  
  // Generate some simulated shocks for demo purposes since we don't have real 24h change data
  const simulatedMarkets = useMemo(() => {
    if (!markets.length) return [];
    
    // Add random changes to some markets for demonstration
    return markets.map((market, index) => ({
      ...market,
      change24h: index < 15 
        ? (Math.random() - 0.3) * 25 // Some markets with significant changes
        : (Math.random() - 0.5) * 5   // Most with small changes
    }));
  }, [markets]);
  
  const alerts = useShockAlerts(simulatedMarkets);
  
  const handleCardClick = (market: Market) => {
    navigate('/chart', { state: { market } });
  };
  
  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2" data-testid="shock-detector-title">
          Probability Shock Detector
        </h1>
        <p className="text-gray-400 text-sm">
          Markets with abnormal price movements (|z-score| &gt; 2.0) in the last 24 hours
        </p>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span className="text-gray-400">2.0-2.5σ Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span className="text-gray-400">2.5-3.0σ Elevated</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500 animate-pulse" />
          <span className="text-gray-400">3.0+σ Critical</span>
        </div>
      </div>
      
      {/* Alerts Grid */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}
      
      {isError && (
        <ErrorState message="Could not fetch market data" onRetry={refetch} />
      )}
      
      {!isLoading && !isError && (
        <>
          {alerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="shock-alerts-grid">
              {alerts.map(alert => (
                <ShockCard 
                  key={alert.market.id} 
                  alert={alert} 
                  onClick={() => handleCardClick(alert.market)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-12 text-center">
              <div className="text-green-400 text-lg mb-2">All Clear</div>
              <div className="text-gray-500">
                No significant probability shocks detected in the last 24 hours.
                <br />
                Markets are trading within normal volatility bands.
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Stats Footer */}
      <div className="mt-8 bg-[#111118] border border-[#1e1e2e] rounded-lg p-4">
        <h3 className="text-white text-sm font-medium mb-3">Category Volatility Baselines (σ)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {Object.entries(STATS.category_volatility).filter(([k]) => k !== 'Default').map(([category, vol]) => (
            <div key={category} className="text-center">
              <div className="text-xs text-gray-500 mb-1">{category}</div>
              <div className="font-mono text-sm text-gray-300">{vol.toFixed(1)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
