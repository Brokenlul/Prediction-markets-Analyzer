import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Nav } from './components/Nav';
import { Dashboard } from './pages/Dashboard';
import { ShockDetector } from './pages/ShockDetector';
import { Chart } from './pages/Chart';

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
              {/* Placeholder routes for future pages */}
              <Route path="/arb" element={<ComingSoon title="Arb Scanner" />} />
              <Route path="/geo" element={<ComingSoon title="Geo Heatmap" />} />
              <Route path="/tail" element={<ComingSoon title="Tail Risk Monitor" />} />
              <Route path="/fed" element={<ComingSoon title="Fed/Macro" />} />
              <Route path="/intel" element={<ComingSoon title="Intelligence" />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="max-w-[1920px] mx-auto px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold text-white mb-4">{title}</h1>
      <p className="text-gray-400">Coming in Phase 2</p>
    </div>
  );
}

export default App;
