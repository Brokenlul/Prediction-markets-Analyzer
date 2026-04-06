import { useQuery } from '@tanstack/react-query';
import { Market, PriceHistoryPoint } from '../types';

function detectCategory(title: string, tags: string[] = []): string {
  const t = (title || '').toLowerCase();
  const tagStr = JSON.stringify(tags || '').toLowerCase();
  
  if (t.includes('bitcoin') || t.includes('btc') || t.includes('ethereum') ||
      t.includes('eth ') || t.includes('crypto') || t.includes('solana') ||
      t.includes('sol ') || t.includes('coinbase') || tagStr.includes('crypto'))
    return 'Crypto';
    
  if (t.includes('fed') || t.includes('fomc') || t.includes('rate cut') ||
      t.includes('rate hike') || t.includes('interest rate') || t.includes('cpi') ||
      t.includes('inflation') || t.includes('gdp') || t.includes('powell') ||
      t.includes('basis point') || tagStr.includes('economics'))
    return 'Finance';
    
  if (t.includes('war') || t.includes('conflict') || t.includes('invasion') ||
      t.includes('military') || t.includes('taiwan') || t.includes('ukraine') ||
      t.includes('israel') || t.includes('iran') || t.includes('nato') ||
      t.includes('nuclear') || t.includes('missile') || t.includes('troops'))
    return 'World Events';
    
  if (t.includes('elect') || t.includes('president') || t.includes('trump') ||
      t.includes('congress') || t.includes('senate') || t.includes('vote') ||
      t.includes('democrat') || t.includes('republican') || t.includes('poll'))
    return 'Politics';
    
  if (t.includes('sec') || t.includes('cftc') || t.includes('regulation') ||
      t.includes('ban') || t.includes('approve') || t.includes('etf') ||
      t.includes('lawsuit') || t.includes('legislation'))
    return 'Finance';
    
  if (t.includes('weather') || t.includes('hurricane') || t.includes('temperature') ||
      t.includes('rainfall') || t.includes('storm') || t.includes('climate'))
    return 'Weather';
    
  if (t.includes('nfl') || t.includes('nba') || t.includes('mlb') ||
      t.includes('super bowl') || t.includes('world cup') || t.includes('olympic') ||
      t.includes('championship') || t.includes('league') || t.includes(' win ') ||
      t.includes(' vs ') || t.includes(' vs. '))
    return 'Sports';
    
  if (t.includes('oscar') || t.includes('grammy') || t.includes('emmy') ||
      t.includes('celebrity') || t.includes('movie') || t.includes('award'))
    return 'Entertainment';
    
  return 'Default';
}

export function usePolymarketMarkets() {
  return useQuery({
    queryKey: ['polymarket-markets'],
    queryFn: async (): Promise<Market[]> => {
      try {
        const res = await fetch(
          '/api/polymarket/markets?active=true&limit=100&order=volume24hr&ascending=false',
          { 
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          }
        );
        
        if (!res.ok) {
          console.error('Polymarket fetch failed:', res.status, res.statusText);
          return [];
        }
        
        const text = await res.text();
        if (!text || text.trim() === '') return [];
        
        const data = JSON.parse(text);
        
        // Handle both array and object response shapes
        const markets = Array.isArray(data) 
          ? data 
          : data.markets || data.data || data.results || [];
        
        return markets
          .filter((m: any) => m && m.active !== false && !m.closed)
          .map((m: any) => {
            // Parse outcomePrices safely
            let yesPrice = 50;
            try {
              const prices = typeof m.outcomePrices === 'string'
                ? JSON.parse(m.outcomePrices)
                : m.outcomePrices || ['0.5', '0.5'];
              yesPrice = parseFloat(prices[0]) * 100;
            } catch {
              yesPrice = 50;
            }
            
            // Parse tags
            const tagNames = (m.tags || []).map((t: any) => t?.label || t?.slug || '');
            
            return {
              id: m.id || m.conditionId || Math.random().toString(),
              title: m.question || m.title || 'Unknown Market',
              yesPrice: isNaN(yesPrice) ? 50 : Math.round(yesPrice * 10) / 10,
              change24h: 0,
              volume24h: parseFloat(m.volume24hr) || parseFloat(m.volumeNum) || 0,
              category: detectCategory(m.question || m.title || '', tagNames),
              source: 'POLY' as const,
              conditionId: m.conditionId || m.id,
              endDate: m.endDate || m.endDateIso || '',
              description: m.description || ''
            };
          });
      } catch (err) {
        console.error('Polymarket fetch error:', err);
        return [];
      }
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
      
      try {
        const fidelity = interval === '1h' ? 60 : interval === '6h' ? 360 : interval === '1d' ? 1440 : 10080;
        const res = await fetch(
          `/api/polymarket-clob/prices-history?market=${conditionId}&interval=${interval}&fidelity=${fidelity}`,
          {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          }
        );
        
        if (!res.ok) {
          console.error('Price history fetch failed:', res.status);
          return [];
        }
        
        const data = await res.json();
        
        // Handle different response formats
        if (data.history && Array.isArray(data.history)) {
          return data.history.map((point: { t: number; p: number }) => ({
            timestamp: point.t * 1000,
            price: parseFloat(String(point.p)) * 100
          }));
        }
        
        if (Array.isArray(data)) {
          return data.map((point: any) => ({
            timestamp: (point.t || point.timestamp) * 1000,
            price: parseFloat(String(point.p || point.price)) * 100
          }));
        }
        
        return [];
      } catch (err) {
        console.error('Price history fetch error:', err);
        return [];
      }
    },
    enabled: !!conditionId,
    staleTime: 60_000,
    retry: 1
  });
}
