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
│   │   ├── components/    # Nav, Skeleton
│   │   ├── data/          # stats.ts (hardcoded calibration data)
│   │   ├── hooks/         # usePolymarket, useKalshi, useMergedMarkets
│   │   ├── pages/         # Dashboard, ShockDetector, Chart
│   │   ├── types/         # TypeScript interfaces
│   │   └── utils/         # normalize, regime
│   ├── vite.config.ts
│   └── tailwind.config.js
└── test_reports/
```

## User Personas
1. **Macro Traders** - Need real-time probability data across multiple markets
2. **Risk Analysts** - Want to monitor geopolitical tail risks and volatility shocks
3. **Quantitative Researchers** - Interested in calibration data and smart money signals

## Core Requirements (Static)
- Live data from Polymarket and Kalshi prediction markets
- Bloomberg-style dark terminal aesthetic
- Probability normalization (0-100% display)
- Category-based filtering and calibration insights
- Shock detection based on z-score analysis
- Historical price charts with technical indicators

---

## What's Been Implemented

### April 1, 2026 - Phase 1 MVP

#### Page 1: Global Probability Dashboard
- ✅ Live market data from Polymarket (via backend proxy)
- ✅ Market table with: Title, YES %, 24H Change, Volume, Calibration, Source
- ✅ Category filter tabs: All, Crypto, Fed & Macro, Geopolitics, Regulation, Elections, Tail Risks
- ✅ High optimism bias warnings for World Events/Entertainment/Media
- ✅ Color-coded YES prices (green >60%, red <40%)
- ✅ Calibration trust score badges with color coding
- ✅ Auto-refresh every 60 seconds

#### Page 2: Probability Shock Detector
- ✅ Z-score calculation based on category volatility baselines
- ✅ Alert cards for markets with |z-score| > 2.0
- ✅ Color-coded severity: yellow (2.0-2.5σ), orange (2.5-3.0σ), red with pulse (3.0+σ)
- ✅ Longshot bias warnings for prices <20%
- ✅ Optimism tax warnings for high-bias categories
- ✅ Category volatility baselines display

#### Page 3: Historical Probability Chart
- ✅ Interactive LineChart with Recharts
- ✅ Price history with 7-period moving average
- ✅ Volume bars at bottom
- ✅ Time interval buttons: 1H, 6H, 1D, 1W
- ✅ Data Insights Panel: Calibration Score, Smart Money Gap, YES/NO Asymmetry
- ✅ Longshot bias warning when applicable
- ✅ Back navigation

#### Global Navigation
- ✅ ProbabilityOS logo in indigo
- ✅ Tab navigation with icons
- ✅ LIVE indicator with pulsing green dot
- ✅ "Updated Xs ago" counter
- ✅ Regime Pill (RISK-ON/RISK-OFF/TRANSITIONING/TAIL-RISK)

#### Backend API Proxy
- ✅ /api/polymarket/markets - Proxy for Gamma API
- ✅ /api/polymarket/prices-history - Proxy for CLOB API
- ✅ /api/kalshi/markets - Proxy for Kalshi API
- ✅ CORS handling with FastAPI middleware

#### Hardcoded STATS Data
- ✅ Category volatility baselines
- ✅ Calibration trust scores per category
- ✅ Smart money gap values
- ✅ Longshot bias table (72.1M trade dataset)
- ✅ YES/NO asymmetry and optimism tax

---

## Prioritized Backlog

### P0 - Critical (Phase 2)
- [ ] Page 4: Cross-Market Arb Scanner (Polymarket vs Kalshi price gaps)
- [ ] Page 5: Geopolitical Risk Heatmap (react-simple-maps)
- [ ] Page 6: Tail Risk Monitor (markets <20% with spike detection)

### P1 - High Priority (Phase 3)
- [ ] Page 7: Fed Path & Macro Certainty (rate path tree, certainty gauge)
- [ ] Page 8: Narrative Momentum + Market Intelligence Panel
- [ ] Real 24h price change calculation from historical data
- [ ] Kalshi market integration in dashboard

### P2 - Medium Priority
- [ ] Portfolio tracking / watchlist feature
- [ ] Alert notifications for shock events
- [ ] Export data to CSV/JSON
- [ ] Mobile-responsive optimization

### P3 - Low Priority / Nice to Have
- [ ] Historical data processing pipeline (36GB dataset)
- [ ] Real-time WebSocket updates
- [ ] User authentication and saved preferences

---

## Next Tasks
1. Implement Cross-Market Arb Scanner (Page 4)
2. Add Geopolitical Risk Heatmap with react-simple-maps (Page 5)
3. Build Tail Risk Monitor with 30-day spike detection (Page 6)
4. Integrate Kalshi markets into the unified dashboard view
