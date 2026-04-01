import { Market } from '../types';
import { STATS } from '../data/stats';

export type RegimeType = 'RISK-ON' | 'TRANSITIONING' | 'RISK-OFF' | 'TAIL-RISK';

export interface RegimeInfo {
  type: RegimeType;
  label: string;
  color: string;
  bgColor: string;
}

export function computeRegime(markets: Market[]): RegimeInfo {
  if (!markets || markets.length === 0) {
    return {
      type: 'TRANSITIONING',
      label: 'LOADING',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    };
  }

  // Count high-shock markets (z-score > 2.5)
  let highShockCount = 0;
  let tailRiskElevated = false;
  
  for (const market of markets) {
    const volatility = STATS.category_volatility[market.category] || STATS.category_volatility.Default;
    const zScore = Math.abs(market.change24h) / volatility;
    
    if (zScore > 2.5) {
      highShockCount++;
    }
    
    // Check for elevated tail risks (World Events or Weather with significant movement)
    if (['World Events', 'Weather'].includes(market.category) && market.yesPrice < 20 && Math.abs(market.change24h) > 5) {
      tailRiskElevated = true;
    }
  }

  // Determine regime
  if (tailRiskElevated) {
    return {
      type: 'TAIL-RISK',
      label: 'TAIL-RISK ELEVATED',
      color: 'text-gray-200',
      bgColor: 'bg-gray-900 border border-gray-600'
    };
  }
  
  if (highShockCount >= 3) {
    return {
      type: 'RISK-OFF',
      label: 'RISK-OFF',
      color: 'text-red-400',
      bgColor: 'bg-red-500/20'
    };
  }
  
  if (highShockCount >= 1) {
    return {
      type: 'TRANSITIONING',
      label: 'TRANSITIONING',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    };
  }
  
  return {
    type: 'RISK-ON',
    label: 'RISK-ON',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20'
  };
}
