import { useQuery } from '@tanstack/react-query';
import { Market, PolymarketMarket, PriceHistoryPoint } from '../types';
import { detectCategory, normalizePolymarketPrice } from '../utils/normalize';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function usePolymarketMarkets() {
  return useQuery({
    queryKey: ['polymarket-markets'],
    queryFn: async (): Promise<Market[]> => {
      const url = `${API_BASE}/api/polymarket/markets?active=true&limit=100&order=volume24hr&ascending=false`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Polymarket markets');
      }
      
      const data: PolymarketMarket[] = await response.json();
      
      if (!Array.isArray(data)) {
        console.warn('Polymarket returned non-array:', data);
        return [];
      }
      
      return data
        .filter(m => m.active && !m.closed)
        .map(market => {
          let yesPrice = 50;
          try {
            const prices = JSON.parse(market.outcomePrices);
            if (Array.isArray(prices) && prices.length > 0) {
              yesPrice = normalizePolymarketPrice(prices[0]);
            }
          } catch {
            // Use default
          }
          
          return {
            id: market.id,
            title: market.question || 'Unknown Market',
            yesPrice,
            change24h: 0, // Will be computed from history if available
            volume24h: market.volume24hr || 0,
            category: detectCategory(market.question || ''),
            source: 'POLY' as const,
            conditionId: market.conditionId,
            endDate: market.endDate,
            description: market.description
          };
        });
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 2
  });
}

export function usePriceHistory(conditionId: string | undefined, interval: string = '1h') {
  return useQuery({
    queryKey: ['price-history', conditionId, interval],
    queryFn: async (): Promise<PriceHistoryPoint[]> => {
      if (!conditionId) return [];
      
      const fidelity = interval === '1h' ? 60 : interval === '6h' ? 360 : interval === '1d' ? 1440 : 10080;
      const url = `${API_BASE}/api/polymarket/prices-history?market=${conditionId}&interval=${interval}&fidelity=${fidelity}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch price history');
      }
      
      const data = await response.json();
      
      // Handle different response formats
      if (data.history && Array.isArray(data.history)) {
        return data.history.map((point: { t: number; p: number }) => ({
          timestamp: point.t * 1000,
          price: normalizePolymarketPrice(point.p)
        }));
      }
      
      if (Array.isArray(data)) {
        return data.map((point: { t: number; p: number } | { timestamp: number; price: number }) => ({
          timestamp: ('t' in point ? point.t : point.timestamp) * 1000,
          price: normalizePolymarketPrice('p' in point ? point.p : point.price)
        }));
      }
      
      return [];
    },
    enabled: !!conditionId,
    staleTime: 60_000,
    retry: 1
  });
}
