import { useQuery } from '@tanstack/react-query';
import { Market, KalshiMarket } from '../types';
import { detectCategory } from '../utils/normalize';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function useKalshiMarkets() {
  return useQuery({
    queryKey: ['kalshi-markets'],
    queryFn: async (): Promise<Market[]> => {
      const url = `${API_BASE}/api/kalshi/markets?status=open&limit=100`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Kalshi markets');
      }
      
      const data = await response.json();
      const markets: KalshiMarket[] = data.markets || [];
      
      return markets.map(market => {
        // Kalshi prices can be in dollars format (0.65 = 65%) or cents (65 = 65%)
        let yesPrice = 50;
        
        if (market.yes_bid_dollars && market.yes_ask_dollars) {
          // New format: prices are in dollars (0.0 - 1.0)
          const yesBid = parseFloat(market.yes_bid_dollars) || 0;
          const yesAsk = parseFloat(market.yes_ask_dollars) || 1;
          yesPrice = ((yesBid + yesAsk) / 2) * 100;
        } else if (market.yes_bid !== undefined || market.yes_ask !== undefined) {
          // Old format: prices in cents (0-100)
          const yesBid = market.yes_bid || 0;
          const yesAsk = market.yes_ask || 100;
          yesPrice = (yesBid + yesAsk) / 2;
        }
        
        // Parse volume
        let volume24h = 0;
        if (market.volume_24h_fp) {
          volume24h = parseFloat(market.volume_24h_fp) || 0;
        } else if (market.volume_24h) {
          volume24h = market.volume_24h;
        } else if (market.volume_fp) {
          volume24h = parseFloat(market.volume_fp) || 0;
        } else if (market.volume) {
          volume24h = market.volume;
        }
        
        return {
          id: market.ticker,
          title: market.title || market.subtitle || 'Unknown Market',
          yesPrice: Math.round(yesPrice * 10) / 10,
          change24h: 0,
          volume24h,
          category: market.category || detectCategory(market.title || ''),
          source: 'KALSHI' as const,
          ticker: market.ticker,
          endDate: market.close_time
        };
      });
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 2
  });
}
