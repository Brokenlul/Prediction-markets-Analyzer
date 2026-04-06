import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft, AlertTriangle, TrendingUp, ExternalLink } from 'lucide-react';
import { useMergedMarkets } from '../hooks/useMergedMarkets';
import { STATS } from '../data/stats';
import { formatPercentage, getCalibrationColor } from '../utils/normalize';
import { LoadingState, ErrorState } from '../components/Skeleton';
import { Market } from '../types';

function jaccardSimilarity(a: string, b: string): number {
  const stopWords = new Set(['will', 'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'been', 'into', 'they', 'before', 'after', 'does', 'more', 'than']);
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w)));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w)));
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

interface ArbPair {
  poly: Market;
  kalshi: Market;
  gap: number;
  similarity: number;
  direction: 'buy_poly' | 'buy_kalshi';
}

export function ArbScanner() {
  const navigate = useNavigate();
  const { markets, isLoading, isError, refetch } = useMergedMarkets();
  const [minGap, setMinGap] = useState(3);

  const polyMarkets = useMemo(() => markets.filter(m => m.source === 'POLY'), [markets]);
  const kalshiMarkets = useMemo(() => markets.filter(m => m.source === 'KALSHI'), [markets]);

  const arbPairs = useMemo(() => {
    const pairs: ArbPair[] = [];
    
    for (const pm of polyMarkets) {
      for (const km of kalshiMarkets) {
        const sim = jaccardSimilarity(pm.title, km.title);
        const gap = Math.abs(pm.yesPrice - km.yesPrice);
        
        if (sim > 0.35 && gap > minGap) {
          pairs.push({
            poly: pm,
            kalshi: km,
            gap,
            similarity: sim,
            direction: pm.yesPrice < km.yesPrice ? 'buy_poly' : 'buy_kalshi'
          });
        }
      }
    }
    
    pairs.sort((a, b) => b.gap - a.gap);
    return pairs;
  }, [polyMarkets, kalshiMarkets, minGap]);

  const getBorderColor = (gap: number) => {
    if (gap >= 10) return 'border-l-red-500';
    if (gap >= 5) return 'border-l-orange-500';
    return 'border-l-yellow-500';
  };

  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ArrowRightLeft className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-semibold text-white" data-testid="arb-scanner-title">
            Cross-Market Arbitrage Scanner
          </h1>
        </div>
        <p className="text-gray-400 text-sm">
          Find same events priced differently on Polymarket vs Kalshi
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Min Gap:</label>
          <select 
            value={minGap}
            onChange={(e) => setMinGap(Number(e.target.value))}
            className="bg-[#111118] border border-[#1e1e2e] rounded px-3 py-1.5 text-sm text-white"
          >
            <option value={3}>3+ pts</option>
            <option value={5}>5+ pts</option>
            <option value={10}>10+ pts</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Comparing {polyMarkets.length} Polymarket</span>
          <span>×</span>
          <span>{kalshiMarkets.length} Kalshi markets</span>
        </div>
      </div>

      {/* Warning if Kalshi is empty */}
      {kalshiMarkets.length === 0 && !isLoading && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-yellow-400 font-medium">Kalshi Data Unavailable</p>
              <p className="text-sm text-gray-400">Showing Polymarket-only data. Arbitrage detection requires both exchanges.</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && <LoadingState message="Scanning for arbitrage opportunities..." />}

      {/* Error */}
      {isError && <ErrorState message="Failed to load market data" onRetry={refetch} />}

      {/* Results */}
      {!isLoading && !isError && (
        <>
          {arbPairs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="arb-pairs-grid">
              {arbPairs.map((pair, index) => {
                const category = pair.poly.category || pair.kalshi.category || 'Default';
                const calibration = STATS.calibration[category] || STATS.calibration.Default;
                
                return (
                  <div 
                    key={`${pair.poly.id}-${pair.kalshi.id}`}
                    className={`bg-[#111118] border border-[#1e1e2e] border-l-4 ${getBorderColor(pair.gap)} rounded-lg p-4 hover:bg-[#161620] transition-colors`}
                  >
                    {/* Title */}
                    <h3 className="text-white font-medium mb-3 leading-tight">
                      {pair.poly.title.length > pair.kalshi.title.length ? pair.poly.title : pair.kalshi.title}
                    </h3>

                    {/* Prices */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex-1 bg-[#0a0a0f] rounded p-3 text-center">
                        <div className="text-xs text-purple-400 mb-1">POLYMARKET</div>
                        <div className="font-mono text-xl font-bold text-white">
                          {formatPercentage(pair.poly.yesPrice)}
                        </div>
                      </div>
                      <div className="text-gray-500">vs</div>
                      <div className="flex-1 bg-[#0a0a0f] rounded p-3 text-center">
                        <div className="text-xs text-blue-400 mb-1">KALSHI</div>
                        <div className="font-mono text-xl font-bold text-white">
                          {formatPercentage(pair.kalshi.yesPrice)}
                        </div>
                      </div>
                    </div>

                    {/* Gap */}
                    <div className={`text-center py-2 rounded mb-3 ${
                      pair.gap >= 10 ? 'bg-red-500/20 text-red-400' :
                      pair.gap >= 5 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      <span className="font-mono font-bold">{pair.gap.toFixed(1)}pt</span> gap
                    </div>

                    {/* Trade Direction */}
                    <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span>
                        {pair.direction === 'buy_poly' 
                          ? 'Buy Polymarket YES, Sell Kalshi YES'
                          : 'Buy Kalshi YES, Sell Polymarket YES'}
                      </span>
                    </div>

                    {/* Calibration */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{category} calibration:</span>
                      <span className={`px-2 py-0.5 rounded border ${getCalibrationColor(calibration.trust_score)}`}>
                        {calibration.trust_score}% trust
                      </span>
                    </div>

                    {/* Click to chart */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-[#1e1e2e]">
                      <button
                        onClick={() => navigate('/chart', { state: { market: pair.poly } })}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-purple-400 hover:text-purple-300 py-1.5"
                      >
                        <ExternalLink className="w-3 h-3" /> POLY Chart
                      </button>
                      <button
                        onClick={() => navigate('/chart', { state: { market: pair.kalshi } })}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-400 hover:text-blue-300 py-1.5"
                      >
                        <ExternalLink className="w-3 h-3" /> KALSHI Chart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-12 text-center">
              <ArrowRightLeft className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <div className="text-gray-400 text-lg mb-2">No Arbitrage Opportunities</div>
              <div className="text-gray-500 text-sm">
                No matching markets found with price gaps above {minGap}pt threshold.
                <br />
                Try lowering the minimum gap or check back later.
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        Similarity threshold: 35% Jaccard index • Gap calculations exclude transaction fees
      </div>
    </div>
  );
}
