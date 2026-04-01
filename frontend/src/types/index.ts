export interface Market {
  id: string;
  title: string;
  yesPrice: number; // 0-100 percentage
  change24h: number; // percentage points
  volume24h: number;
  category: string;
  source: 'POLY' | 'KALSHI';
  conditionId?: string;
  ticker?: string;
  endDate?: string;
  description?: string;
}

export interface PriceHistoryPoint {
  timestamp: number;
  price: number;
}

export interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  outcomePrices: string;
  volume: string;
  volume24hr: number;
  liquidity: string;
  active: boolean;
  closed: boolean;
  endDate: string;
  description: string;
  outcomes: string;
  tags: { id: string; label: string; slug: string }[];
}

export interface KalshiMarket {
  ticker: string;
  title: string;
  subtitle?: string;
  status: string;
  yes_bid?: number;
  yes_ask?: number;
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  no_bid?: number;
  no_ask?: number;
  last_price?: number;
  last_price_dollars?: string;
  volume?: number;
  volume_fp?: string;
  volume_24h?: number;
  volume_24h_fp?: string;
  open_interest?: number;
  close_time: string;
  event_ticker?: string;
  category?: string;
}

export interface ShockAlert {
  market: Market;
  zScore: number;
  previousPrice: number;
  absoluteChange: number;
  relativeChange: number;
  volumeMultiple: number;
}
