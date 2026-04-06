import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, AlertTriangle, MapPin } from 'lucide-react';
import { useMergedMarkets } from '../hooks/useMergedMarkets';
import { STATS } from '../data/stats';
import { formatPercentage } from '../utils/normalize';
import { LoadingState, ErrorState } from '../components/Skeleton';
import { Market } from '../types';

const COUNTRY_MAP: Record<string, { keywords: string[]; name: string }> = {
  US: { keywords: ['united states', 'usa', 'america', 'trump', 'congress', 'fed rate', 'dollar', 's&p', 'tariff', 'biden', 'white house'], name: 'United States' },
  CN: { keywords: ['china', 'chinese', 'beijing', 'xi jinping', 'taiwan strait', 'ccp'], name: 'China' },
  RU: { keywords: ['russia', 'russian', 'moscow', 'putin'], name: 'Russia' },
  UA: { keywords: ['ukraine', 'ukrainian', 'kyiv', 'zelensky'], name: 'Ukraine' },
  IR: { keywords: ['iran', 'iranian', 'tehran', 'nuclear', 'hormuz', 'persian'], name: 'Iran' },
  KP: { keywords: ['north korea', 'dprk', 'kim jong', 'pyongyang'], name: 'North Korea' },
  IL: { keywords: ['israel', 'israeli', 'gaza', 'hamas', 'netanyahu', 'tel aviv'], name: 'Israel' },
  TW: { keywords: ['taiwan', 'taipei', 'invasion taiwan', 'tsmc'], name: 'Taiwan' },
  IN: { keywords: ['india', 'indian', 'modi', 'delhi'], name: 'India' },
  GB: { keywords: ['uk ', 'britain', 'british', 'sterling', 'boe', 'london'], name: 'United Kingdom' },
  JP: { keywords: ['japan', 'japanese', 'yen', 'boj', 'tokyo'], name: 'Japan' },
  SA: { keywords: ['saudi', 'aramco', 'opec', 'riyadh'], name: 'Saudi Arabia' },
  TR: { keywords: ['turkey', 'turkish', 'erdogan', 'lira', 'ankara'], name: 'Turkey' },
  BR: { keywords: ['brazil', 'lula', 'real brl', 'brasilia'], name: 'Brazil' },
  EU: { keywords: ['europe', 'european', 'ecb', 'eurozone', 'brussels'], name: 'European Union' },
  DE: { keywords: ['germany', 'german', 'bundesbank', 'berlin'], name: 'Germany' },
  FR: { keywords: ['france', 'french', 'macron', 'paris'], name: 'France' },
  KR: { keywords: ['south korea', 'korean', 'seoul'], name: 'South Korea' },
  MX: { keywords: ['mexico', 'mexican', 'peso'], name: 'Mexico' },
  VE: { keywords: ['venezuela', 'maduro', 'caracas'], name: 'Venezuela' },
};

function getCountryForMarket(title: string): string | null {
  const lowerTitle = title.toLowerCase();
  for (const [code, { keywords }] of Object.entries(COUNTRY_MAP)) {
    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword)) {
        return code;
      }
    }
  }
  return null;
}

function getProbabilityColor(prob: number): string {
  if (prob >= 60) return 'bg-red-900/80 border-red-700';
  if (prob >= 35) return 'bg-orange-900/80 border-orange-700';
  if (prob >= 15) return 'bg-yellow-900/80 border-yellow-700';
  return 'bg-green-900/80 border-green-700';
}

function getProbabilityBg(prob: number): string {
  if (prob >= 60) return '#3d0000';
  if (prob >= 35) return '#3d1a00';
  if (prob >= 15) return '#2d2200';
  return '#0d1f0d';
}

interface GeoMarket extends Market {
  countryCode: string;
}

export function GeoHeatmap() {
  const navigate = useNavigate();
  const { markets, isLoading, isError, refetch } = useMergedMarkets();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const geoMarkets = useMemo(() => {
    const result: GeoMarket[] = [];
    for (const market of markets) {
      const country = getCountryForMarket(market.title);
      if (country) {
        result.push({ ...market, countryCode: country });
      }
    }
    return result;
  }, [markets]);

  const marketsByCountry = useMemo(() => {
    const grouped: Record<string, GeoMarket[]> = {};
    for (const market of geoMarkets) {
      if (!grouped[market.countryCode]) {
        grouped[market.countryCode] = [];
      }
      grouped[market.countryCode].push(market);
    }
    // Sort each country's markets by probability descending
    for (const code of Object.keys(grouped)) {
      grouped[code].sort((a, b) => b.yesPrice - a.yesPrice);
    }
    return grouped;
  }, [geoMarkets]);

  const countryStats = useMemo(() => {
    const stats: Record<string, { maxProb: number; count: number; name: string }> = {};
    for (const [code, markets] of Object.entries(marketsByCountry)) {
      const maxProb = Math.max(...markets.map(m => m.yesPrice));
      stats[code] = {
        maxProb,
        count: markets.length,
        name: COUNTRY_MAP[code]?.name || code
      };
    }
    return stats;
  }, [marketsByCountry]);

  const sortedCountries = useMemo(() => {
    return Object.entries(countryStats)
      .sort((a, b) => b[1].maxProb - a[1].maxProb);
  }, [countryStats]);

  const selectedMarkets = selectedCountry ? marketsByCountry[selectedCountry] || [] : [];

  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-semibold text-white" data-testid="geo-heatmap-title">
            Geopolitical Risk Heatmap
          </h1>
        </div>
        <p className="text-gray-400 text-sm">
          Markets with geopolitical implications mapped by country • {geoMarkets.length} geo markets detected
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium">World Events Calibration Warning</p>
            <p className="text-sm text-gray-400">
              World Events has a <span className="font-mono text-yellow-300">7.32pp</span> smart money gap — the highest of any category. 
              These probabilities reflect retail sentiment more than informed positioning. Treat with extra skepticism.
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && <LoadingState message="Loading geopolitical markets..." />}

      {/* Error */}
      {isError && <ErrorState message="Failed to load market data" onRetry={refetch} />}

      {/* Main Content */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Country List */}
          <div className="lg:col-span-2">
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-4">
              <h3 className="text-white font-medium mb-4">Countries by Max Risk Probability</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {sortedCountries.map(([code, stats]) => (
                  <button
                    key={code}
                    onClick={() => setSelectedCountry(selectedCountry === code ? null : code)}
                    className={`
                      p-3 rounded-lg border transition-all text-left
                      ${selectedCountry === code 
                        ? 'border-indigo-500 bg-indigo-500/10' 
                        : 'border-[#1e1e2e] hover:border-[#2a2a3e]'}
                    `}
                    style={{ backgroundColor: selectedCountry === code ? undefined : getProbabilityBg(stats.maxProb) }}
                    data-testid={`country-${code}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-white font-medium text-sm">{stats.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-lg font-bold ${
                        stats.maxProb >= 60 ? 'text-red-400' :
                        stats.maxProb >= 35 ? 'text-orange-400' :
                        stats.maxProb >= 15 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {stats.maxProb.toFixed(0)}%
                      </span>
                      <span className="text-xs text-gray-500">{stats.count} markets</span>
                    </div>
                  </button>
                ))}
              </div>

              {sortedCountries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No geopolitical markets detected
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-xs">
              <span className="text-gray-500">Risk Level:</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0d1f0d' }} />
                <span className="text-gray-400">&lt;15%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#2d2200' }} />
                <span className="text-gray-400">15-35%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3d1a00' }} />
                <span className="text-gray-400">35-60%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3d0000' }} />
                <span className="text-gray-400">&gt;60%</span>
              </div>
            </div>
          </div>

          {/* Selected Country Markets */}
          <div className="lg:col-span-1">
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-4 sticky top-20">
              {selectedCountry ? (
                <>
                  <h3 className="text-white font-medium mb-3">
                    {COUNTRY_MAP[selectedCountry]?.name || selectedCountry} Markets
                  </h3>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {selectedMarkets.map(market => (
                      <div
                        key={market.id}
                        onClick={() => navigate('/chart', { state: { market } })}
                        className={`p-3 rounded border cursor-pointer transition-all hover:bg-[#1a1a24] ${getProbabilityColor(market.yesPrice)}`}
                      >
                        <p className="text-sm text-white mb-2 line-clamp-2">{market.title}</p>
                        <div className="flex items-center justify-between">
                          <span className={`font-mono font-bold ${
                            market.yesPrice >= 60 ? 'text-red-400' :
                            market.yesPrice >= 35 ? 'text-orange-400' :
                            market.yesPrice >= 15 ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {formatPercentage(market.yesPrice)}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            market.source === 'POLY' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {market.source}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a country to view markets</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        Country detection based on keyword matching • World Events smart money gap: 7.32pp
      </div>
    </div>
  );
}
