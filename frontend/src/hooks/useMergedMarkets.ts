import { useMemo, useEffect } from 'react';
import { usePolymarketMarkets } from './usePolymarket';
import { useKalshiMarkets } from './useKalshi';
import { Market, ShockAlert } from '../types';
import { STATS } from '../data/stats';

// Connection test on app load
let hasTestedConnection = false;

export function useMergedMarkets() {
  const polymarket = usePolymarketMarkets();
  const kalshi = useKalshiMarkets();
  
  // Run connection test once
  useEffect(() => {
    if (hasTestedConnection) return;
    hasTestedConnection = true;
    
    const testConnections = async () => {
      console.group('ProbabilityOS API Connection Test');
      
      // Test Polymarket
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
      
      // Test Kalshi
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
  
  const markets = useMemo(() => {
    const poly = polymarket.data || [];
    const kalshiData = kalshi.data || [];
    
    // Merge and dedupe by title similarity if needed
    const merged: Market[] = [...poly, ...kalshiData];
    
    // Sort by volume
    merged.sort((a, b) => b.volume24h - a.volume24h);
    
    return merged;
  }, [polymarket.data, kalshi.data]);
  
  const isLoading = polymarket.isLoading && kalshi.isLoading;
  const isError = polymarket.isError && kalshi.isError && markets.length === 0;
  const error = polymarket.error || kalshi.error;
  
  return {
    markets,
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
          volumeMultiple: 1.5 + Math.random() * 2 // Simulated for now
        });
      }
    }
    
    // Sort by z-score descending
    alerts.sort((a, b) => b.zScore - a.zScore);
    
    return alerts;
  }, [markets]);
}
