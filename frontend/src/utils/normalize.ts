// Category detection keywords
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Crypto: ['crypto', 'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'defi', 'blockchain', 'token', 'nft', 'altcoin', 'binance', 'coinbase', 'ripple', 'xrp', 'dogecoin', 'cardano', 'matic', 'avalanche', 'avax', 'chainlink', 'link', 'uniswap', 'polkadot', 'dot', 'litecoin', 'ltc', 'shiba', 'pepe'],
  Equities: ['s&p', 'sp500', 'sp 500', 'nasdaq', 'dow jones', 'stock market', 'equit', 'ipo', 'earnings', 'market cap', 'bull market', 'bear market', 'rally', 'correction', 'spy', 'qqq', 'iwm', 'russell', 'vix', 'volatility index', 'stock price', 'share price', 'market crash', 'all-time high', 'ath'],
  Commodities: ['oil', 'crude', 'gold', 'silver', 'copper', 'wheat', 'corn', 'natural gas', 'commodity', 'opec', 'wti', 'brent', 'precious metal', 'energy price', 'gasoline', 'platinum', 'palladium', 'cocoa', 'coffee', 'sugar', 'soybean', 'lumber', 'cotton', 'iron ore', 'lithium'],
  Finance: ['fed', 'rate', 'fomc', 'inflation', 'gdp', 'unemployment', 'recession', 'treasury', 'bond', 'yield', 'cpi', 'ppi', 'jobs', 'payroll', 'economic', 'interest rate', 'federal reserve', 'monetary', 'fiscal', 'bank', 'debt ceiling', 'default', 'deficit'],
  Politics: ['election', 'vote', 'president', 'senate', 'congress', 'democrat', 'republican', 'biden', 'trump', 'governor', 'poll', 'primary', 'candidate', 'ballot', 'electoral', 'political', 'legislation', 'bill', 'veto'],
  "World Events": ['war', 'conflict', 'invasion', 'military', 'sanctions', 'coup', 'nato', 'russia', 'ukraine', 'china', 'taiwan', 'geopolit', 'israel', 'gaza', 'iran', 'north korea', 'syria', 'terror', 'missile', 'nuclear'],
  Sports: ['nfl', 'nba', 'mlb', 'nhl', 'super bowl', 'championship', 'playoffs', 'world series', 'stanley cup', 'mvp', 'draft', 'football', 'basketball', 'baseball', 'hockey', 'soccer', 'tennis', 'golf', 'olympics', 'ufc', 'boxing'],
  Entertainment: ['oscar', 'grammy', 'emmy', 'movie', 'film', 'album', 'song', 'artist', 'celebrity', 'award', 'netflix', 'disney', 'streaming', 'box office', 'concert', 'tour', 'album', 'billboard'],
  Weather: ['hurricane', 'storm', 'temperature', 'weather', 'climate', 'flood', 'drought', 'tornado', 'earthquake', 'wildfire', 'snow', 'rain', 'heat wave'],
  Media: ['twitter', 'x.com', 'facebook', 'meta', 'instagram', 'tiktok', 'youtube', 'social media', 'elon musk', 'zuckerberg', 'tech ceo', 'silicon valley']
};

export function detectCategory(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'Default';
}

// Map user-facing filter categories to internal categories
export const FILTER_CATEGORIES = [
  { id: 'all', label: 'All', categories: [] },
  { id: 'hot', label: '🔥 Hot', categories: [] }, // handled specially — importance tier filter
  { id: 'crypto', label: 'Crypto', categories: ['Crypto'] },
  { id: 'equities', label: 'Equities', categories: ['Equities'] },
  { id: 'commodities', label: 'Commodities', categories: ['Commodities'] },
  { id: 'fed-macro', label: 'Fed & Macro', categories: ['Finance'] },
  { id: 'geopolitics', label: 'Geopolitics', categories: ['World Events', 'Politics'] },
  { id: 'elections', label: 'Elections', categories: ['Politics'] },
  { id: 'tail-risks', label: 'Tail Risks', categories: ['World Events', 'Weather'] },
];

export function normalizePolymarketPrice(price: number | string): number {
  const p = typeof price === 'string' ? parseFloat(price) : price;
  return Math.round(p * 100 * 100) / 100; // Returns percentage with 2 decimals
}

export function normalizeKalshiPrice(price: number): number {
  // Kalshi prices are in cents (1-99), already representing percentage
  return Math.round(price * 100) / 100;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function truncateTitle(title: string, maxLength: number = 60): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
}

export function getPriceColor(price: number): string {
  if (price >= 60) return 'text-green-500';
  if (price <= 40) return 'text-red-500';
  return 'text-white';
}

export function getChangeColor(change: number): string {
  if (change > 0) return 'text-green-500';
  if (change < 0) return 'text-red-500';
  return 'text-gray-400';
}

export function getChangeArrow(change: number): string {
  if (change > 0) return '▲';
  if (change < 0) return '▼';
  return '–';
}

export function getCalibrationColor(trustScore: number): string {
  if (trustScore >= 90) return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (trustScore >= 70) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
}

export function getZScoreColor(zScore: number): string {
  const absZ = Math.abs(zScore);
  if (absZ >= 3.0) return 'border-red-500 bg-red-500/10';
  if (absZ >= 2.5) return 'border-orange-500 bg-orange-500/10';
  if (absZ >= 2.0) return 'border-yellow-500 bg-yellow-500/10';
  return 'border-gray-600 bg-gray-800/50';
}

export function isHighBiasCategory(category: string): boolean {
  return ['Entertainment', 'Media', 'World Events'].includes(category);
}
