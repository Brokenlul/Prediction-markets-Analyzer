import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Nav } from './components/Nav';
import { Dashboard } from './pages/Dashboard';
import { ShockDetector } from './pages/ShockDetector';
import { Chart } from './pages/Chart';
import { ArbScanner } from './pages/ArbScanner';
import { GeoHeatmap } from './pages/GeoHeatmap';
import { TailRisk } from './pages/TailRisk';
import { FedMacro } from './pages/FedMacro';
import { Intelligence } from './pages/Intelligence';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0a0a0f]">
          <Nav />
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/shocks" element={<ShockDetector />} />
              <Route path="/chart" element={<Chart />} />
              <Route path="/arb-scanner" element={<ArbScanner />} />
              <Route path="/geo-heatmap" element={<GeoHeatmap />} />
              <Route path="/tail-risk" element={<TailRisk />} />
              <Route path="/fed-macro" element={<FedMacro />} />
              <Route path="/intelligence" element={<Intelligence />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
