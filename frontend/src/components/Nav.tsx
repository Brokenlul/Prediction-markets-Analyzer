import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Activity, TrendingUp, LineChart, ArrowRightLeft, Globe, AlertTriangle, Landmark, Brain } from 'lucide-react';
import { useMergedMarkets } from '../hooks/useMergedMarkets';
import { computeRegime } from '../utils/regime';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: Activity },
  { path: '/shocks', label: 'Shock Detector', icon: TrendingUp },
  { path: '/chart', label: 'Chart', icon: LineChart },
  { path: '/arb-scanner', label: 'Arb Scanner', icon: ArrowRightLeft },
  { path: '/geo-heatmap', label: 'Geo Heatmap', icon: Globe },
  { path: '/tail-risk', label: 'Tail Risk', icon: AlertTriangle },
  { path: '/fed-macro', label: 'Fed/Macro', icon: Landmark },
  { path: '/intelligence', label: 'Intelligence', icon: Brain },
];

export function Nav() {
  const location = useLocation();
  const { markets } = useMergedMarkets();
  const [lastUpdated, setLastUpdated] = useState(0);
  const regime = computeRegime(markets);
  
  useEffect(() => {
    setLastUpdated(0);
    const interval = setInterval(() => {
      setLastUpdated(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [markets]);
  
  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur border-b border-[#1e1e2e]">
      <div className="max-w-[1920px] mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg font-bold text-[#6366f1]" data-testid="logo">
            ProbabilityOS
          </span>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1" data-testid="nav-tabs">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors
                ${isActive || (item.path === '/' && location.pathname === '/')
                  ? 'bg-[#6366f1]/20 text-[#6366f1]'
                  : 'text-gray-400 hover:text-white hover:bg-[#1e1e2e]'
                }
              `}
              data-testid={`nav-${item.label.toLowerCase().replace(/[^a-z]/g, '-')}`}
            >
              <item.icon className="w-4 h-4" />
              <span className="hidden md:inline">{item.label}</span>
            </NavLink>
          ))}
        </div>
        
        {/* Right Side: Live Indicator + Regime */}
        <div className="flex items-center gap-4">
          {/* Live Indicator */}
          <div className="flex items-center gap-2 text-sm" data-testid="live-indicator">
            <span className="w-2 h-2 rounded-full bg-green-500 live-pulse" />
            <span className="text-green-400 font-medium">LIVE</span>
            <span className="text-gray-500">
              Updated {lastUpdated}s ago
            </span>
          </div>
          
          {/* Regime Pill */}
          <div 
            className={`px-3 py-1 rounded-full text-xs font-semibold ${regime.bgColor} ${regime.color}`}
            data-testid="regime-pill"
          >
            {regime.label}
          </div>
        </div>
      </div>
    </nav>
  );
}
