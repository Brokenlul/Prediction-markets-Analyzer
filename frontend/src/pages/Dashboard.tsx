import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ExternalLink, RefreshCw, Zap, TrendingUp } from 'lucide-react';
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

// Visual config for importance tiers
const TIER_CONFIG = {
  CRITICAL: {
    rowBg: 'bg-red-500/8 hover:bg-red-500/15',
    border: 'border-l-4 border-l-red-500',
    badge: 'bg-red-500 text-white',
    label: 'CRITICAL',
    icon: '⚡',
    pulse: true,
  },
  HIGH: {
    rowBg: 'bg-orange-500/6 hover:bg-orange-500/12',
    border: 'border-l-4 border-l-orange-400',
    badge: 'bg-orange-500 text-white',
    label: 'HIGH',
    icon: '🔥',
    pulse: false,
  },
  MEDIUM: {
    rowBg: 'hover:bg-[#1a1a24]',
    border: 'border-l-2 border-l-yellow-500/50',
    badge: 'bg-yellow-500/20 text-yellow-400',
    label: 'MED',
    icon: '',
    pulse: false,
  },
  LOW: {
    rowBg: 'hover:bg-[#1a1a24]',
    border: 'border-l border-l-transparent',
    badge: '',
    label: '',
    icon: '',
    pulse: false,
  },
};

export function Dashboard() {
  const navigate = useNavigate();
  const { markets, newMarketsCount, isLoading, isError, refetch, polyStatus, kalshiStatus } = useMergedMarkets();
  const [activeFilter, setActiveFilter] = useState('all');
  const [lastUpdated] = useState(() => new Date());
  const [showNewBanner, setShowNewBanner] = useState(false);
  const [bannerCount, setBannerCount] = useState(0);

  // Show new-markets banner when new markets are detected
  useEffect(() => {
    if (newMarketsCount > 0) {
      setBannerCount(newMarketsCount);
      setShowNewBanner(true);
      const timer = setTimeout(() => setShowNewBanner(false), 12_000);
      return () => clearTimeout(timer);
    }
  }, [newMarketsCount]);

  const filteredMarkets = useMemo(() => {
    if (activeFilter === 'all') return markets;

    // Hot = CRITICAL or HIGH importance tier
    if (activeFilter === 'hot') {
      return markets.filter(m => m.importanceTier === 'CRITICAL' || m.importanceTier === 'HIGH');
    }

    const filterConfig = FILTER_CATEGORIES.find(f => f.id === activeFilter);
    if (!filterConfig || filterConfig.categories.length === 0) return markets;

    return markets.filter(m => filterConfig.categories.includes(m.category));
  }, [markets, activeFilter]);

  // Compute signals for Signal Feed
  const signals = useMemo(() => {
    return computeSignals(markets, STATS.category_volatility);
  }, [markets]);

  const handleMarketClick = (market: Market) => {
    navigate('/chart', { state: { market } });
  };

  // Count hot markets for badge
  const hotCount = useMemo(() => {
    return markets.filter(m => m.importanceTier === 'CRITICAL' || m.importanceTier === 'HIGH').length;
  }, [markets]);

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
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-white mb-1" data-testid="dashboard-title">
          Global Probability Dashboard
        </h1>
        <p className="text-gray-400 text-sm">
          Live prediction market data from Polymarket & Kalshi • {markets.length} active markets • auto-refreshes every 30s
        </p>
      </div>

      {/* New Markets Banner */}
      {showNewBanner && (
        <div className="mb-4 flex items-center gap-3 bg-teal-500/15 border border-teal-500/40 rounded-lg px-4 py-2.5 text-teal-300 text-sm animate-pulse">
          <TrendingUp className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>{bannerCount} new market{bannerCount > 1 ? 's' : ''}</strong> detected since your last visit
          </span>
          <button
            onClick={() => setShowNewBanner(false)}
            className="ml-auto text-teal-500 hover:text-teal-300 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Signal Feed */}
      {!isLoading && signals.length > 0 && (
        <SignalFeed
          signals={signals}
          onSignalClick={handleMarketClick}
          lastUpdated={lastUpdated}
        />
      )}

      {/* Category Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2" data-testid="category-filters">
        {FILTER_CATEGORIES.map(filter => {
          const isHot = filter.id === 'hot';
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`
                relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5
                ${isActive
                  ? isHot
                    ? 'bg-orange-500 text-white'
                    : 'bg-[#6366f1] text-white'
                  : isHot
                    ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30'
                    : 'bg-[#1e1e2e] text-gray-400 hover:text-white hover:bg-[#2a2a3e]'
                }
              `}
              data-testid={`filter-${filter.id}`}
            >
              {filter.label}
              {isHot && !isLoading && hotCount > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-orange-500/30 text-orange-300'}`}>
                  {hotCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Importance Legend */}
      {!isLoading && (
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-500 inline-block"></span>
            <span className="text-red-400 font-medium">CRITICAL</span> — major move / high conviction
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block"></span>
            <span className="text-orange-400 font-medium">HIGH</span> — significant move
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-3 rounded-sm bg-teal-400 inline-block"></span>
            <span className="text-teal-400 font-medium">NEW</span> — recently listed
          </span>
        </div>
      )}

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
                const tier = market.importanceTier || 'LOW';
                const tierCfg = TIER_CONFIG[tier];

                return (
                  <tr
                    key={market.id}
                    onClick={() => handleMarketClick(market)}
                    className={`
                      border-b border-[#1e1e2e] cursor-pointer transition-colors
                      ${tierCfg.rowBg} ${tierCfg.border}
                      ${tierCfg.pulse ? 'animate-pulse-subtle' : ''}
                    `}
                    data-testid={`market-row-${market.id}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Importance badge */}
                          {(tier === 'CRITICAL' || tier === 'HIGH') && (
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold leading-tight flex-shrink-0 ${tierCfg.badge}`}>
                              {tier === 'CRITICAL' && <Zap className="w-2.5 h-2.5" />}
                              {tierCfg.label}
                            </span>
                          )}
                          {/* NEW badge */}
                          {market.isNew && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold leading-tight flex-shrink-0 bg-teal-500/20 text-teal-300 border border-teal-500/30">
                              NEW
                            </span>
                          )}
                          <span className="text-white text-sm">
                            {truncateTitle(market.title)}
                          </span>
                        </div>
                        {showBiasWarning && (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-500">
                            <AlertTriangle className="w-3 h-3" />
                            High optimism bias in {market.category}
                          </span>
                        )}
                        <span className="text-xs text-gray-600">{market.category}</span>
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
        <span>Data source: Polymarket Gamma API, Kalshi Trade API • sorted by importance</span>
        <span>Based on {STATS.key_findings.total_trades} trades, {STATS.key_findings.total_volume} volume ({STATS.key_findings.dataset_period})</span>
      </div>
    </div>
  );
}
