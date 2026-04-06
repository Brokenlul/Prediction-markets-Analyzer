import { Market } from '../types';

export const TRADE_IMPLICATIONS: Record<string, string[]> = {
  middle_east_conflict_rising: [
    "Long crude oil — supply disruption risk",
    "Long gold — safe haven bid",
    "Long defense ETFs: ITA, XAR, CACI",
    "Long tanker stocks: FRO, STNG, DHT",
    "Short airlines: JETS ETF (fuel costs)",
    "Long VIX calls — volatility hedge"
  ],
  middle_east_conflict_falling: [
    "Short crude oil — supply normalizing",
    "Long airlines — fuel cost relief",
    "Short defense ETFs",
    "Risk-on: Long EM equities"
  ],
  hormuz_disruption_rising: [
    "Long crude oil: USO, XLE",
    "Long tanker stocks: FRO, STNG, DHT",
    "Long oil majors: XOM, CVX, BP",
    "Short airlines: JETS ETF",
    "Long defense: ITA, XAR"
  ],
  fed_cut_rising: [
    "Long bonds: TLT, IEF",
    "Long gold — real rates falling",
    "Long growth: QQQ",
    "Long small caps: IWM",
    "Short USD: UUP put spreads",
    "Long Bitcoin — liquidity expansion"
  ],
  fed_cut_falling: [
    "Short bonds: TBT (inverse TLT)",
    "Long USD",
    "Short gold",
    "Rotate to value stocks",
    "Short rate-sensitive REITs"
  ],
  fed_hike_rising: [
    "Short bonds: TBT",
    "Long USD",
    "Short gold",
    "Short crypto — risk off",
    "Long financials: XLF"
  ],
  crypto_etf_approval_rising: [
    "Long BTC spot",
    "Long ETH spot",
    "Long miners: MARA, RIOT",
    "Long Coinbase: COIN",
    "Long MicroStrategy: MSTR"
  ],
  crypto_etf_approval_falling: [
    "Reduce crypto exposure",
    "Long stablecoins vs BTC ratio",
    "Put spreads on COIN, MARA, RIOT"
  ],
  crypto_ban_rising: [
    "Short crypto across the board",
    "Long stablecoins",
    "Exit exchange stocks: COIN"
  ],
  taiwan_conflict_rising: [
    "Long defense: ITA, XAR, NOC, RTX",
    "Long gold",
    "Short TSMC: TSM — supply chain risk",
    "Short tech hardware",
    "Long domestic chips: INTC",
    "Short Hang Seng"
  ],
  taiwan_conflict_falling: [
    "Long TSMC: TSM",
    "Long tech hardware",
    "Long Hang Seng",
    "Risk-on EM Asia"
  ],
  russia_escalation_rising: [
    "Long European defense: BAES.L, AIR.PA",
    "Long gold",
    "Long natural gas: UNG",
    "Short European banks — sanctions exposure",
    "Long wheat futures — grain supply risk"
  ],
  trump_policy_rising: [
    "Long domestic energy: XLE",
    "Long defense",
    "Short green energy: ICLN",
    "Long USD",
    "Long crypto — deregulation"
  ],
  trump_policy_falling: [
    "Long green energy: ICLN, NEE",
    "Long international equities",
    "Short USD"
  ],
  recession_rising: [
    "Long bonds: TLT",
    "Long gold",
    "Long defensives: XLV, XLP",
    "Short cyclicals: XLY, XLI",
    "Long VIX",
    "Short high-yield: HYG"
  ],
  recession_falling: [
    "Long cyclicals",
    "Short bonds",
    "Risk-on: Long SPY, QQQ",
    "Short VIX"
  ],
  us_debt_default_rising: [
    "Long gold — safe haven",
    "Long short-term T-bills",
    "Long Swiss Franc: FXF",
    "Short S&P 500",
    "Long VIX"
  ],
  cpi_high_rising: [
    "Long TIPS ETF",
    "Long gold",
    "Long commodities: DJP",
    "Short long bonds: TLT",
    "Long energy: XLE"
  ],
  generic_crypto_rising: [
    "Long BTC spot",
    "Long crypto miners: MARA, RIOT",
    "Long COIN"
  ],
  generic_crypto_falling: [
    "Reduce crypto exposure",
    "Long stablecoins vs BTC"
  ],
  generic_geopolitical_rising: [
    "Long gold",
    "Long VIX",
    "Short EM equities",
    "Long defense ETFs"
  ],
  generic_finance_rising: [
    "Long bonds: TLT",
    "Long gold",
    "Short USD"
  ],
  generic_finance_falling: [
    "Short bonds: TBT",
    "Long USD",
    "Long financials: XLF"
  ]
};

export function classifySignal(
  title: string,
  direction: 'rising' | 'falling',
  category: string
): string[] {
  const t = title.toLowerCase();

  if (t.includes('hormuz') || t.includes('strait of hormuz'))
    return TRADE_IMPLICATIONS.hormuz_disruption_rising;

  if (t.includes('taiwan') || t.includes('china invasion'))
    return direction === 'rising'
      ? TRADE_IMPLICATIONS.taiwan_conflict_rising
      : TRADE_IMPLICATIONS.taiwan_conflict_falling;

  if (t.includes('iran') || t.includes('middle east') ||
      t.includes('israel') || t.includes('gaza'))
    return direction === 'rising'
      ? TRADE_IMPLICATIONS.middle_east_conflict_rising
      : TRADE_IMPLICATIONS.middle_east_conflict_falling;

  if (t.includes('russia') || t.includes('ukraine') || t.includes('nato'))
    return TRADE_IMPLICATIONS.russia_escalation_rising;

  if ((t.includes('fed') || t.includes('fomc')) && t.includes('cut'))
    return direction === 'rising'
      ? TRADE_IMPLICATIONS.fed_cut_rising
      : TRADE_IMPLICATIONS.fed_cut_falling;

  if ((t.includes('fed') || t.includes('fomc')) && t.includes('hike'))
    return TRADE_IMPLICATIONS.fed_hike_rising;

  if (t.includes('etf') && (t.includes('bitcoin') || t.includes('btc') ||
      t.includes('ethereum') || t.includes('crypto')))
    return direction === 'rising'
      ? TRADE_IMPLICATIONS.crypto_etf_approval_rising
      : TRADE_IMPLICATIONS.crypto_etf_approval_falling;

  if (t.includes('ban') && (t.includes('crypto') || t.includes('bitcoin')))
    return TRADE_IMPLICATIONS.crypto_ban_rising;

  if (t.includes('trump') || t.includes('tariff') || t.includes('republican'))
    return direction === 'rising'
      ? TRADE_IMPLICATIONS.trump_policy_rising
      : TRADE_IMPLICATIONS.trump_policy_falling;

  if (t.includes('recession') || (t.includes('gdp') && t.includes('negative')))
    return direction === 'rising'
      ? TRADE_IMPLICATIONS.recession_rising
      : TRADE_IMPLICATIONS.recession_falling;

  if (t.includes('default') && (t.includes('us') || t.includes('debt')))
    return TRADE_IMPLICATIONS.us_debt_default_rising;

  if (t.includes('cpi') || t.includes('inflation'))
    return TRADE_IMPLICATIONS.cpi_high_rising;

  if (t.includes('oil') || t.includes('opec') || t.includes('crude'))
    return direction === 'rising'
      ? TRADE_IMPLICATIONS.middle_east_conflict_rising
      : TRADE_IMPLICATIONS.middle_east_conflict_falling;

  // Category fallbacks
  if (category === 'Crypto')
    return direction === 'rising'
      ? TRADE_IMPLICATIONS.generic_crypto_rising
      : TRADE_IMPLICATIONS.generic_crypto_falling;

  if (category === 'Finance')
    return direction === 'rising'
      ? TRADE_IMPLICATIONS.generic_finance_rising
      : TRADE_IMPLICATIONS.generic_finance_falling;

  if (category === 'World Events' || category === 'Politics')
    return TRADE_IMPLICATIONS.generic_geopolitical_rising;

  return ['Monitor correlated asset exposure', 'Check position sizing'];
}

export interface Signal {
  id: string;
  type: 'trend_bearish' | 'trend_bullish' | 'shock' | 'threshold' | 'tail_risk';
  market: Market;
  prevPct: number;
  currPct: number;
  absChange: number;
  relChange: number;
  zScore?: number;
  thresholdCrossed?: number;
  direction: 'rising' | 'falling';
  priceHistory: { t: number; p: number }[];
  tradeImplications: string[];
  severity: number;
}

export function computeSignals(
  markets: Market[],
  categoryVolatility: Record<string, number>
): Signal[] {
  const signals: Signal[] = [];

  for (const market of markets) {
    const curr = market.yesPrice;
    const change = market.change24h;
    const prev24h = curr - change;
    const direction: 'rising' | 'falling' = change >= 0 ? 'rising' : 'falling';
    const vol = categoryVolatility[market.category] ?? categoryVolatility.Default ?? 3.5;
    const zScore = Math.abs(change) / vol;
    const implications = classifySignal(market.title, direction, market.category);

    // Generate mock price history for sparkline
    const mockHistory = generateMockPriceHistory(curr, change);

    // Type 1: Shock (z-score > 2.5)
    if (zScore > 2.5) {
      signals.push({
        id: `shock-${market.id}`,
        type: 'shock',
        market,
        prevPct: prev24h,
        currPct: curr,
        absChange: change,
        relChange: prev24h > 0 ? (change / prev24h) * 100 : 0,
        zScore,
        direction,
        priceHistory: mockHistory,
        tradeImplications: implications,
        severity: zScore > 3 ? 10 : 8
      });
      continue; // Don't duplicate
    }

    // Type 2: Strong trend (>5pp move)
    if (Math.abs(change) > 5) {
      signals.push({
        id: `trend-${market.id}`,
        type: change < 0 ? 'trend_bearish' : 'trend_bullish',
        market,
        prevPct: prev24h,
        currPct: curr,
        absChange: change,
        relChange: prev24h > 0 ? (change / prev24h) * 100 : 0,
        direction,
        priceHistory: mockHistory,
        tradeImplications: implications,
        severity: Math.abs(change) > 15 ? 7 : 5
      });
      continue;
    }

    // Type 3: Threshold cross (25%, 50%, 75%)
    const thresholds = [25, 50, 75];
    for (const t of thresholds) {
      const crossedDown = prev24h >= t && curr < t;
      const crossedUp = prev24h < t && curr >= t;
      if (crossedDown || crossedUp) {
        signals.push({
          id: `threshold-${t}-${market.id}`,
          type: 'threshold',
          market,
          prevPct: prev24h,
          currPct: curr,
          absChange: change,
          relChange: prev24h > 0 ? (change / prev24h) * 100 : 0,
          thresholdCrossed: t,
          direction: crossedUp ? 'rising' : 'falling',
          priceHistory: mockHistory,
          tradeImplications: implications,
          severity: t === 50 ? 9 : 6
        });
        break;
      }
    }

    // Type 4: Tail risk rising (<10% and rising)
    if (curr < 10 && change > 2) {
      signals.push({
        id: `tail-${market.id}`,
        type: 'tail_risk',
        market,
        prevPct: prev24h,
        currPct: curr,
        absChange: change,
        relChange: prev24h > 0 ? (change / prev24h) * 100 : 0,
        direction: 'rising',
        priceHistory: mockHistory,
        tradeImplications: implications,
        severity: 7
      });
    }
  }

  // Sort by severity descending, deduplicate by market.id
  const seen = new Set<string>();
  return signals
    .sort((a, b) => b.severity - a.severity)
    .filter(s => {
      if (seen.has(s.market.id)) return false;
      seen.add(s.market.id);
      return true;
    });
}

function generateMockPriceHistory(current: number, change: number): { t: number; p: number }[] {
  const points = 48;
  const now = Date.now();
  const data: { t: number; p: number }[] = [];
  const start = current - change;
  
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const noise = (Math.random() - 0.5) * 2;
    const price = start + (change * progress) + noise;
    data.push({
      t: now - (points - i) * 3600000,
      p: Math.max(0, Math.min(100, price))
    });
  }
  
  // Ensure last point matches current
  data[data.length - 1].p = current;
  
  return data;
}
