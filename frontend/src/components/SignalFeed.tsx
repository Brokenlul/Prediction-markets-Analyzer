import { useState } from 'react';
import { ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { Signal } from '../utils/signals';
import { SignalCard } from './SignalCard';
import { Market } from '../types';

interface SignalFeedProps {
  signals: Signal[];
  onSignalClick: (market: Market) => void;
  lastUpdated: Date;
}

export function SignalFeed({ signals, onSignalClick, lastUpdated }: SignalFeedProps) {
  const [collapsed, setCollapsed] = useState(false);
  const secondsAgo = Math.round((Date.now() - lastUpdated.getTime()) / 1000);

  return (
    <div className="mb-5" data-testid="signal-feed">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-[#e2e2f0]">LIVE SIGNAL FEED</span>
          </div>
          <span className="text-xs text-gray-500">
            Actionable probability moves with trade implications
          </span>
          <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
            {signals.length} active
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            Updated {secondsAgo}s ago
          </span>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-transparent border border-[#1e1e2e] px-2.5 py-1 rounded transition-colors"
            data-testid="toggle-signal-feed"
          >
            {collapsed ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show Feed
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Hide Feed
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feed Content */}
      {!collapsed && (
        <div 
          className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin"
          data-testid="signal-feed-content"
        >
          {signals.length === 0 ? (
            <div className="w-full text-center py-8 bg-[#111118] border border-[#1e1e2e] rounded-lg">
              <p className="text-gray-500 text-sm">No active signals — markets are quiet</p>
            </div>
          ) : (
            signals.slice(0, 10).map(signal => (
              <SignalCard
                key={signal.id}
                signal={signal}
                onClick={() => onSignalClick(signal.market)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
