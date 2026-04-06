import { Signal } from '../utils/signals';
import { Sparkline } from './Sparkline';

const TYPE_CONFIG: Record<Signal['type'], { label: string; border: string }> = {
  trend_bearish: { label: 'BEARISH TREND', border: '#ef4444' },
  trend_bullish: { label: 'BULLISH TREND', border: '#22c55e' },
  shock: { label: 'SHOCK', border: '#f97316' },
  threshold: { label: 'THRESHOLD', border: '#eab308' },
  tail_risk: { label: 'TAIL RISK', border: '#8b5cf6' },
};

const TYPE_EMOJI: Record<Signal['type'], string> = {
  trend_bearish: '📉',
  trend_bullish: '📈',
  shock: '⚡',
  threshold: '🔴',
  tail_risk: '⚫',
};

interface SignalCardProps {
  signal: Signal;
  onClick: () => void;
}

export function SignalCard({ signal, onClick }: SignalCardProps) {
  const cfg = TYPE_CONFIG[signal.type];
  const emoji = TYPE_EMOJI[signal.type];
  const isShock = signal.type === 'shock';

  return (
    <div
      onClick={onClick}
      className={`
        w-80 flex-shrink-0 bg-[#111118] border border-[#1e1e2e] rounded-lg p-3.5
        cursor-pointer transition-all hover:bg-[#161620] hover:border-[#2a2a3e]
        ${isShock ? 'animate-pulse-border' : ''}
      `}
      style={{ borderLeftWidth: 3, borderLeftColor: cfg.border }}
      data-testid={`signal-card-${signal.id}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <span 
          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ 
            color: cfg.border, 
            backgroundColor: `${cfg.border}20`,
          }}
        >
          {emoji} {cfg.label}
        </span>
        <span className={`
          text-[10px] px-2 py-0.5 rounded border border-[#1e1e2e]
          ${signal.market.source === 'POLY' 
            ? 'bg-purple-500/10 text-purple-400' 
            : 'bg-blue-500/10 text-blue-400'}
        `}>
          {signal.market.source}
        </span>
      </div>

      {/* Title */}
      <p className="text-xs font-medium text-[#d1d1e0] mb-2.5 line-clamp-2 leading-relaxed">
        {signal.market.title}
      </p>

      {/* Sparkline */}
      <div className="mb-2.5">
        <Sparkline data={signal.priceHistory} direction={signal.direction} height={40} />
      </div>

      {/* Price Change */}
      <div className="flex items-center gap-2 font-mono text-xs mb-3">
        <span className="text-gray-500">{signal.prevPct.toFixed(1)}%</span>
        <span className="text-gray-600">→</span>
        <span className={signal.direction === 'rising' ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
          {signal.currPct.toFixed(1)}%
        </span>
        <span className={signal.direction === 'rising' ? 'text-green-400' : 'text-red-400'}>
          {signal.absChange >= 0 ? '+' : ''}{signal.absChange.toFixed(1)}pp
        </span>
        {signal.zScore && (
          <span className="text-orange-400 ml-auto">
            {signal.zScore.toFixed(1)}σ
          </span>
        )}
      </div>

      {/* Trade Implications */}
      <div className="border-t border-[#1e1e2e] pt-2.5">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1.5">
          Trade Implications
        </p>
        <div className="space-y-1">
          {signal.tradeImplications.slice(0, 3).map((imp, i) => (
            <p key={i} className="text-[11px] text-gray-400 flex items-start gap-1.5">
              <span className="text-indigo-400 mt-0.5">→</span>
              <span>{imp}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
