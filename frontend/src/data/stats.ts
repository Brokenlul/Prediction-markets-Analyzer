export const STATS = {
  category_volatility: {
    Crypto: 4.2,
    Finance: 1.1,
    Sports: 3.8,
    Politics: 2.9,
    Weather: 2.1,
    Entertainment: 5.4,
    "World Events": 6.1,
    Media: 6.8,
    Default: 3.5
  } as Record<string, number>,
  
  calibration: {
    Crypto: { trust_score: 89, note: "Slight overconfidence at high probabilities" },
    Finance: { trust_score: 99, note: "Near-perfect calibration — most reliable" },
    Sports: { trust_score: 91, note: "Reliable for high-probability outcomes" },
    Politics: { trust_score: 87, note: "Good calibration, watch for partisan bias" },
    Weather: { trust_score: 93, note: "Highly calibrated — data-driven" },
    Entertainment: { trust_score: 71, note: "High optimism bias — discount longshots" },
    Media: { trust_score: 68, note: "Very high bias — treat with skepticism" },
    "World Events": { trust_score: 65, note: "Highest bias category — 7.32pp smart money gap" },
    Default: { trust_score: 80, note: "Moderate reliability" }
  } as Record<string, { trust_score: number; note: string }>,
  
  smart_money_gap: {
    Sports: 2.23,
    Politics: 1.02,
    Crypto: 2.69,
    Finance: 0.17,
    Weather: 2.57,
    Entertainment: 4.79,
    Media: 7.28,
    "World Events": 7.32,
    Default: 2.5
  } as Record<string, number>,
  
  longshot_bias: [
    { range: "1-10%", implied: 5.0, actual: 3.8, bias: -24 },
    { range: "11-20%", implied: 15.0, actual: 13.2, bias: -12 },
    { range: "21-30%", implied: 25.0, actual: 24.1, bias: -3.6 },
    { range: "31-50%", implied: 40.0, actual: 40.8, bias: 2.0 },
    { range: "51-70%", implied: 60.0, actual: 61.1, bias: 1.8 },
    { range: "71-80%", implied: 75.0, actual: 76.2, bias: 1.6 },
    { range: "81-90%", implied: 85.0, actual: 86.0, bias: 1.2 },
    { range: "91-99%", implied: 95.0, actual: 95.83, bias: 0.9 }
  ],
  
  yes_no_asymmetry: {
    Crypto: { taker_yes_pct: 0.58, optimism_tax: 1.85 },
    Sports: { taker_yes_pct: 0.54, optimism_tax: 1.23 },
    Finance: { taker_yes_pct: 0.50, optimism_tax: 0.04 },
    Default: { taker_yes_pct: 0.53, optimism_tax: 1.12 }
  } as Record<string, { taker_yes_pct: number; optimism_tax: number }>,
  
  key_findings: {
    total_trades: "72.1 million",
    total_volume: "$18.26 billion",
    taker_avg_return: -1.12,
    maker_avg_return: 1.12,
    yes_buyer_return: -1.02,
    no_buyer_return: 0.83,
    optimism_tax: 1.85,
    dataset_period: "2021-2025"
  }
};

export function getLongshotBias(price: number): { implied: number; actual: number; bias: number } | null {
  if (price <= 10) return STATS.longshot_bias[0];
  if (price <= 20) return STATS.longshot_bias[1];
  if (price <= 30) return STATS.longshot_bias[2];
  if (price <= 50) return STATS.longshot_bias[3];
  if (price <= 70) return STATS.longshot_bias[4];
  if (price <= 80) return STATS.longshot_bias[5];
  if (price <= 90) return STATS.longshot_bias[6];
  if (price <= 99) return STATS.longshot_bias[7];
  return null;
}
