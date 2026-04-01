import { useMemo } from 'react';
import { usePolymarketMarkets } from './usePolymarket';
import { useKalshiMarkets } from './useKalshi';
import { Market, ShockAlert } from '../types';
import { STATS } from '../data/stats';

export function useMergedMarkets() {
  const polymarket = usePolymarketMarkets();
  const kalshi = useKalshiMarkets();
  
  const markets = useMemo(() => {
    const poly = polymarket.data || [];
    const kalshiData = kalshi.data || [];
    
    // Merge and dedupe by title similarity if needed
    const merged: Market[] = [...poly, ...kalshiData];
    
    // Sort by volume
    merged.sort((a, b) => b.volume24h - a.volume24h);
    
    return merged;
  }, [polymarket.data, kalshi.data]);
  
  const isLoading = polymarket.isLoading || kalshi.isLoading;
  const isError = polymarket.isError && kalshi.isError;
  const error = polymarket.error || kalshi.error;
  
  return {
    markets,
    isLoading,
    isError,
    error,
    refetch: () => {
      polymarket.refetch();
      kalshi.refetch();
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
