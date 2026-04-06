# ProbabilityOS - Product Requirements Document

## Original Problem Statement
Build a macro intelligence terminal called "ProbabilityOS" — a dark, professional, data-dense web app that turns prediction market data into macro trading intelligence. Dark terminal aesthetic. Think Bloomberg meets probability.

## Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite, Tailwind CSS, Recharts, React Query, react-router-dom
- **Backend**: FastAPI (Python) for API proxying (CORS handling)
- **APIs**: Polymarket Gamma API, Polymarket CLOB API, Kalshi Trade API

### File Structure
```
/app/
├── backend/
│   ├── server.py          # FastAPI proxy server
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/    # Nav, Skeleton, SignalFeed, SignalCard, Sparkline
│   │   ├── data/          # stats.ts (hardcoded calibration data)
│   │   ├── hooks/         # usePolymarket, useKalshi, useMergedMarkets
│   │   ├── pages/         # Dashboard, ShockDetector, Chart, ArbScanner, GeoHeatmap, TailRisk, FedMacro, Intelligence
│   │   ├── types/         # TypeScript interfaces
│   │   └── utils/         # normalize, regime, signals
│   ├── vite.config.ts
│   └── tailwind.config.js
└── test_reports/
```

## User Personas
1. **Macro Traders** - Need real-time probability data across multiple markets with trade implications
2. **Risk Analysts** - Want to monitor geopolitical tail risks and volatility shocks
3. **Quantitative Researchers** - Interested in calibration data and smart money signals

## Core Requirements (Static)
- Live data from Polymarket and Kalshi prediction markets
- Bloomberg-style dark terminal aesthetic
- Probability normalization (0-100% display)
- Category-based filtering and calibration insights
- Shock detection based on z-score analysis
- Historical price charts with technical indicators
- Trade implications for actionable signals

---

## What's Been Implemented

### April 1, 2026 - Phase 1 MVP
- ✅ Dashboard with live market data
- ✅ Shock Detector with z-score analysis
- ✅ Chart page with price history

### April 6, 2026 - Phase 2 Complete + Signal Feed

#### Page 1: Dashboard (Enhanced)
- ✅ Live market data from Polymarket + Kalshi (128+ markets)
- ✅ **NEW: Signal Feed** with actionable probability moves
  - Signal types: SHOCK, TREND, THRESHOLD, TAIL RISK
  - Sparkline charts for each signal
  - Trade implications (e.g., "Long crude oil", "Short airlines")
  - Horizontal scrolling ticker tape design
- ✅ Category filter tabs
- ✅ Market table with calibration badges
- ✅ Click-to-chart navigation

#### Page 2: Shock Detector
- ✅ Z-score calculation with color-coded severity
- ✅ Clickable cards navigate to Chart
- ✅ Longshot bias warnings
- ✅ Optimism tax warnings

#### Page 3: Chart (Fixed)
- ✅ **FIX**: Market context now passed via router state
- ✅ **NEW**: Searchable market dropdown
- ✅ Interactive LineChart with price history
- ✅ Time interval buttons (1H, 6H, 1D, 1W)
- ✅ Data Insights panel with STATS

#### Page 4: Arb Scanner (Rebuilt)
- ✅ **FIX**: No longer blank screen
- ✅ Jaccard similarity matching for cross-exchange pairs
- ✅ Gap threshold filter (3pt, 5pt, 10pt)
- ✅ Shows POLY vs KALSHI price comparisons
- ✅ Error handling and warning banners

#### Page 5: Geo Heatmap (Rebuilt)
- ✅ **FIX**: No longer blank screen
- ✅ Country keyword detection (17 countries)
- ✅ Color-coded risk levels by max probability
- ✅ Clickable countries show related markets
- ✅ World Events calibration warning banner

#### Page 6: Tail Risk Monitor (Built)
- ✅ Filters markets where YES < 20%
- ✅ Relative change calculation
- ✅ Longshot bias warnings from STATS
- ✅ Calibration and smart money gap display
- ✅ Longshot bias table from 72.1M trades

#### Page 7: Fed/Macro (Built)
- ✅ Fed keyword filtering (fed, fomc, rate, cpi, inflation, etc.)
- ✅ Markets sorted by end date
- ✅ **Macro Certainty Score** gauge (0-100)
- ✅ Finance category insight box (99% calibration, 0.17pp gap)
- ✅ "Why Trust Fed Markets?" explanation

#### Page 8: Intelligence (Built)
- ✅ **Narrative Momentum Leaderboard** with Rising/Falling tabs
- ✅ **Optimism Tax chart** - YES vs NO buyer returns
- ✅ **Smart Money Gap chart** - Category comparison
- ✅ **Longshot Trap chart** - Implied vs actual win rates
- ✅ Key Intelligence Takeaway summary

#### Global Components
- ✅ Navigation with all 8 pages active
- ✅ LIVE indicator with update counter
- ✅ Regime Pill (RISK-ON/RISK-OFF/TRANSITIONING/TAIL-RISK)
- ✅ Signal Feed with trade implications

#### Signal System (NEW)
- ✅ `src/utils/signals.ts` - Signal classification and trade implications
- ✅ `src/components/SignalCard.tsx` - Individual signal cards
- ✅ `src/components/SignalFeed.tsx` - Horizontal scrolling feed
- ✅ `src/components/Sparkline.tsx` - Mini price charts
- ✅ TRADE_IMPLICATIONS mapping for:
  - Middle East conflict
  - Hormuz disruption
  - Taiwan conflict
  - Fed rate decisions
  - Crypto ETF approvals
  - Trump/tariff policies
  - Recession indicators
  - And more...

---

## Prioritized Backlog

### P0 - Critical
- [x] All 8 pages working ✅
- [x] Signal Feed with trade implications ✅
- [x] Chart navigation fixed ✅

### P1 - High Priority
- [ ] Real price history fetching (replace mock data)
- [ ] WebSocket for real-time updates
- [ ] Actual 24h change from API data
- [ ] More Kalshi markets integration

### P2 - Medium Priority
- [ ] Portfolio tracking / watchlist
- [ ] Alert notifications
- [ ] Export to CSV/JSON
- [ ] Mobile responsive optimization

### P3 - Low Priority
- [ ] Historical data processing (36GB dataset)
- [ ] User authentication
- [ ] Saved preferences

---

## Next Tasks
1. Implement real price history API calls
2. Add WebSocket for live updates
3. Expand trade implications for more market types
4. Add export functionality
