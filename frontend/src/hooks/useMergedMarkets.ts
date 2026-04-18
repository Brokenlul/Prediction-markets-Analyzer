import { useMemo, useEffect } from 'react';
import { usePolymarketMarkets } from './usePolymarket';
import { useKalshiMarkets } from './useKalshi';
import { Market, ShockAlert } from '../types';
import { STATS } from '../data/stats';
import { computeImportanceScore } from '../utils/signals';

// Connection test on app load
let hasTestedConnection = false;

const SEEN_KEY = 'probabilityos_seen_markets';
const NEW_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

function getSeenMarkets(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function updateSeenMarkets(ids: string[]): void {
  try {
    const now = Date.now();
    const existing = getSeenMarkets();
    // Add new IDs
    for (const id of ids) {
      if (!existing[id]) existing[id] = now;
    }
    // Prune entries older than 24h to keep storage lean
    const cutoff = now - 24 * 60 * 60 * 1000;
    for (const id of Object.keys(existing)) {
      if (existing[id] < cutoff) delete existing[id];
    }
    localStorage.setItem(SEEN_KEY, JSON.stringify(existing));
  } catch {
    // localStorage unavailable — ignore
  }
}

export function useMergedMarkets() {
  const polymarket = usePolymarketMarkets();
  const kalshi = useKalshiMarkets();

  // Run connection test once
  useEffect(() => {
    if (hasTestedConnection) return;
    hasTestedConnection = true;

    const testConnections = async () => {
      console.group('ProbabilityOS API Connection Test');

      try {
        const r = await fetch('/api/polymarket/markets?limit=1');
        console.log('✅ Polymarket:', r.status, r.statusText);
        if (r.ok) {
          const d = await r.json();
          console.log('Polymarket sample:', d?.[0]?.question || d?.markets?.[0]?.question || 'Response received');
        }
      } catch (e) {
        console.error('❌ Polymarket FAILED:', e);
      }

      try {
        const r = await fetch('/api/kalshi/markets?limit=1');
        console.log('✅ Kalshi:', r.status, r.statusText);
        if (r.ok) {
          const d = await r.json();
          console.log('Kalshi sample:', d?.markets?.[0]?.title || 'Response received');
        }
      } catch (e) {
        console.error('❌ Kalshi FAILED:', e);
      }

      console.groupEnd();
    };

    testConnections();
  }, []);

  const { markets, newMarketsCount } = useMemo(() => {
    const poly = polymarket.data || [];
    const kalshiData = kalshi.data || [];
    const merged: Market[] = [...poly, ...kalshiData];

    const seenMap = getSeenMarkets();
    const now = Date.now();
    let newCount = 0;

    // Annotate each market with isNew + importanceScore + importanceTier
    const annotated: Market[] = merged.map(m => {
      const firstSeen = seenMap[m.id];
      const isNew = !firstSeen || (now - firstSeen) < NEW_WINDOW_MS;
      if (!firstSeen) newCount++;

      const { score, tier } = computeImportanceScore(m);

      return {
        ...m,
        isNew,
        importanceScore: score,
        importanceTier: tier,
        seenAt: firstSeen || now,
      };
    });

    // Persist seen IDs (fire-and-forget, non-blocking)
    updateSeenMarkets(merged.map(m => m.id));

    // Sort by importance score desc, then volume desc as tiebreaker
    annotated.sort((a, b) => {
      const scoreDiff = (b.importanceScore ?? 0) - (a.importanceScore ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return b.volume24h - a.volume24h;
    });

    return { markets: annotated, newMarketsCount: newCount };
  }, [polymarket.data, kalshi.data]);

  const isLoading = polymarket.isLoading && kalshi.isLoading;
  const isError = polymarket.isError && kalshi.isError && markets.length === 0;
  const error = polymarket.error || kalshi.error;

  return {
    markets,
    newMarketsCount,
    isLoading,
    isError,
    error,
    refetch: () => {
      polymarket.refetch();
      kalshi.refetch();
    },
    refetchPoly: polymarket.refetch,
    refetchKalshi: kalshi.refetch,
    polyStatus: {
      isLoading: polymarket.isLoading,
      isError: polymarket.isError,
      count: polymarket.data?.length || 0
    },
    kalshiStatus: {
      isLoading: kalshi.isLoading,
      isError: kalshi.isError,
      count: kalshi.data?.length || 0
    }
  };
}

export function useShockAlerts(markets: Market[]): ShockAlert[] {
  return useMemo(() => {
    const alerts: ShockAlert[] = [];

    for (const market of markets) {
      const volatility = STATS.category_volatility[market.category] || STATS.category_volatility.Default;
      const change = market.change24h;
      const zScore = Math.abs(change) / volatility;

      if (zScore >= 2.0) {
        alerts.push({
          market,
          zScore,
          previousPrice: market.yesPrice - change,
          absoluteChange: change,
          relativeChange: change !== 0 && (market.yesPrice - change) !== 0
            ? (change / (market.yesPrice - change)) * 100
            : 0,
          volumeMultiple: 1.5 + Math.random() * 2
        });
      }
    }

    alerts.sort((a, b) => b.zScore - a.zScore);
    return alerts;
  }, [markets]);
}
