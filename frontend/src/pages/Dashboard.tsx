import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { useMergedMarkets } from '../hooks/useMergedMarkets';
import { STATS } from '../data/stats';
import { computeSignals } from '../utils/signals';
import { 
  truncateTitle, 
  formatPercentage, 
  formatVolume, 
  getPriceColor, 
  getChangeColor, 
  getChangeArrow,
  getCalibrationColor,
  isHighBiasCategory,
  FILTER_CATEGORIES
} from '../utils/normalize';
import { SkeletonRow } from '../components/Skeleton';
import { SignalFeed } from '../components/SignalFeed';
import { Market } from '../types';

export function Dashboard() {
  const navigate = useNavigate();
  const { markets, isLoading, isError, refetch, polyStatus, kalshiStatus } = useMergedMarkets();
  const [activeFilter, setActiveFilter] = useState('all');
  const [lastUpdated] = useState(() => new Date());
  
  const marketsWithChanges = markets;
  
  const filteredMarkets = useMemo(() => {
    if (activeFilter === 'all') return marketsWithChanges;
    
    const filterConfig = FILTER_CATEGORIES.find(f => f.id === activeFilter);
    if (!filterConfig || filterConfig.categories.length === 0) return marketsWithChanges;
    
    return marketsWithChanges.filter(m => filterConfig.categories.includes(m.category));
  }, [marketsWithChanges, activeFilter]);
  
  // Compute signals for Signal Feed
  const signals = useMemo(() => {
    return computeSignals(marketsWithChanges, STATS.category_volatility);
  }, [marketsWithChanges]);
  
  const handleMarketClick = (market: Market) => {
    navigate('/chart', { state: { market } });
  };

  // Error state with detailed diagnostics
  if (isError || (markets.length === 0 && !isLoading)) {
    return (
      <div className="max-w-[1920px] mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold text-white mb-2" data-testid="dashboard-title">
          Global Probability Dashboard
        </h1>
        
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-5 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium mb-2">API Connection Issue</p>
              <p className="text-gray-400 text-sm mb-3">
                Could not fetch live market data. This is typically a CORS proxy configuration issue.
              </p>
              
              <div className="bg-[#0a0a0f] rounded p-3 mb-4 text-xs font-mono">
                <p className="text-gray-500 mb-2">Connection Status:</p>
                <p className={polyStatus.count > 0 ? 'text-green-400' : 'text-red-400'}>
                  • Polymarket: {polyStatus.isLoading ? 'Loading...' : polyStatus.count > 0 ? `${polyStatus.count} markets` : 'Failed'}
                </p>
                <p className={kalshiStatus.count > 0 ? 'text-green-400' : 'text-red-400'}>
                  • Kalshi: {kalshiStatus.isLoading ? 'Loading...' : kalshiStatus.count > 0 ? `${kalshiStatus.count} markets` : 'Failed'}
                </p>
              </div>
              
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Connection
              </button>
            </div>
          </div>
        </div>
        
        <p className="text-gray-500 text-xs">
          Check browser console for detailed API connection diagnostics.
        </p>
      </div>
    );
  }
  
  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2" data-testid="dashboard-title">
          Global Probability Dashboard
        </h1>
        <p className="text-gray-400 text-sm">
          Live prediction market data from Polymarket & Kalshi • {markets.length} active markets
        </p>
      </div>
      
      {/* Signal Feed */}
      {!isLoading && signals.length > 0 && (
        <SignalFeed 
          signals={signals}
          onSignalClick={handleMarketClick}
          lastUpdated={lastUpdated}
        />
      )}
      
      {/* Category Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2" data-testid="category-filters">
        {FILTER_CATEGORIES.map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${activeFilter === filter.id 
                ? 'bg-[#6366f1] text-white' 
                : 'bg-[#1e1e2e] text-gray-400 hover:text-white hover:bg-[#2a2a3e]'
              }
            `}
            data-testid={`filter-${filter.id}`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      
      {/* Markets Table */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="markets-table">
            <thead className="bg-[#0a0a0f]">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">Market</th>
                <th className="py-3 px-4 font-medium text-right">YES %</th>
                <th className="py-3 px-4 font-medium text-right">24h Change</th>
                <th className="py-3 px-4 font-medium text-right">Volume</th>
                <th className="py-3 px-4 font-medium text-center">Calibration</th>
                <th className="py-3 px-4 font-medium text-center">Source</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <SkeletonRow key={i} cols={6} />
                  ))}
                </>
              )}
              
              {!isLoading && filteredMarkets.map(market => {
                const calibration = STATS.calibration[market.category] || STATS.calibration.Default;
                const showBiasWarning = isHighBiasCategory(market.category);
                
                return (
                  <tr 
                    key={market.id}
                    onClick={() => handleMarketClick(market)}
                    className="border-b border-[#1e1e2e] hover:bg-[#1a1a24] cursor-pointer transition-colors"
                    data-testid={`market-row-${market.id}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-white text-sm">
                          {truncateTitle(market.title)}
                        </span>
                        {showBiasWarning && (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-500">
                            <AlertTriangle className="w-3 h-3" />
                            High optimism bias in {market.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono text-lg font-semibold ${getPriceColor(market.yesPrice)}`}>
                        {formatPercentage(market.yesPrice)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono text-sm ${getChangeColor(market.change24h)}`}>
                        {getChangeArrow(market.change24h)} {Math.abs(market.change24h).toFixed(1)}pp
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono text-sm text-gray-300">
                        {formatVolume(market.volume24h)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span 
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getCalibrationColor(calibration.trust_score)}`}
                        title={calibration.note}
                      >
                        {calibration.trust_score}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                        ${market.source === 'POLY' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-blue-500/20 text-blue-400'
                        }
                      `}>
                        {market.source}
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {!isLoading && filteredMarkets.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No markets found for this filter
          </div>
        )}
      </div>
      
      {/* Footer Stats */}
      <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
        <span>Data source: Polymarket Gamma API, Kalshi Trade API</span>
        <span>Based on {STATS.key_findings.total_trades} trades, {STATS.key_findings.total_volume} volume ({STATS.key_findings.dataset_period})</span>
      </div>
    </div>
  );
}
