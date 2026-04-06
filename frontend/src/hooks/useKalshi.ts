import { useQuery } from '@tanstack/react-query';
import { Market } from '../types';

function detectCategory(title: string, categoryHint: string = ''): string {
  const t = (title || '').toLowerCase();
  const c = (categoryHint || '').toLowerCase();
  
  if (t.includes('bitcoin') || t.includes('btc') || t.includes('ethereum') ||
      t.includes('eth ') || t.includes('crypto') || t.includes('solana') ||
      c.includes('crypto'))
    return 'Crypto';
    
  if (t.includes('fed') || t.includes('fomc') || t.includes('rate cut') ||
      t.includes('rate hike') || t.includes('interest rate') || t.includes('cpi') ||
      t.includes('inflation') || t.includes('gdp') || t.includes('powell') ||
      t.includes('basis point') || c.includes('economics') || c.includes('finance'))
    return 'Finance';
    
  if (t.includes('war') || t.includes('conflict') || t.includes('invasion') ||
      t.includes('military') || t.includes('taiwan') || t.includes('ukraine') ||
      t.includes('israel') || t.includes('iran') || t.includes('nato') ||
      t.includes('nuclear') || t.includes('missile') || t.includes('troops'))
    return 'World Events';
    
  if (t.includes('elect') || t.includes('president') || t.includes('trump') ||
      t.includes('congress') || t.includes('senate') || t.includes('vote') ||
      t.includes('democrat') || t.includes('republican') || t.includes('poll') ||
      c.includes('politic'))
    return 'Politics';
    
  if (t.includes('weather') || t.includes('hurricane') || t.includes('temperature') ||
      t.includes('rainfall') || t.includes('storm') || t.includes('climate') ||
      c.includes('weather'))
    return 'Weather';
    
  if (t.includes('nfl') || t.includes('nba') || t.includes('mlb') ||
      t.includes('super bowl') || t.includes('world cup') || t.includes('olympic') ||
      t.includes('championship') || t.includes('league') || t.includes(' win ') ||
      t.includes(' vs ') || t.includes(' vs. ') || c.includes('sport'))
    return 'Sports';
    
  if (t.includes('oscar') || t.includes('grammy') || t.includes('emmy') ||
      t.includes('celebrity') || t.includes('movie') || t.includes('award') ||
      c.includes('entertainment'))
    return 'Entertainment';
    
  return 'Default';
}

export function useKalshiMarkets() {
  return useQuery({
    queryKey: ['kalshi-markets'],
    queryFn: async (): Promise<Market[]> => {
      try {
        const res = await fetch(
          '/api/kalshi/markets?status=open&limit=100',
          {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          }
        );
        
        if (!res.ok) {
          console.error('Kalshi fetch failed:', res.status, res.statusText);
          return [];
        }
        
        const text = await res.text();
        if (!text || text.trim() === '') return [];
        
        const data = JSON.parse(text);
        const markets = data.markets || data.data || (Array.isArray(data) ? data : []);
        
        return markets
          .filter((m: any) => m && (m.status === 'open' || m.status === 'active'))
          .map((m: any) => {
            let yesPrice = 50;
            if (m.yes_bid_dollars !== undefined || m.yes_ask_dollars !== undefined) {
              const yesBid = parseFloat(m.yes_bid_dollars) || 0;
              const yesAsk = parseFloat(m.yes_ask_dollars) || 1;
              yesPrice = ((yesBid + yesAsk) / 2) * 100;
            } else if (m.last_price_dollars !== undefined) {
              yesPrice = parseFloat(m.last_price_dollars) * 100;
            }

            const prevPrice = parseFloat(m.previous_price_dollars) * 100 || yesPrice;
            const change24h = yesPrice - prevPrice;

            return {
              id: m.ticker || m.id,
              title: m.title || m.subtitle || 'Unknown Market',
              yesPrice: Math.round(yesPrice * 10) / 10,
              change24h: Math.round(change24h * 10) / 10,
              volume24h: m.volume || 0,
              category: detectCategory(m.title || '', m.category || ''),
              source: 'KALSHI' as const,
              ticker: m.ticker,
              endDate: m.close_time || m.expected_expiration_time || ''
            };
          })
          .filter((m: Market) => m.yesPrice > 0.5 && m.yesPrice < 99.5);
      } catch (err) {
        console.error('Kalshi fetch error:', err);
        return [];
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 2
  });
}
