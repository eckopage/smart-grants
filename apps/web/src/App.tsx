import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { initAnalytics, trackPageView } from './lib/analytics';
import { ApplicationWorkspacePage } from './pages/ApplicationWorkspacePage';
import { DashboardPage } from './pages/DashboardPage';
import { GrantDetailPage } from './pages/GrantDetailPage';
import { GrantsPage } from './pages/GrantsPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { PricingPage } from './pages/PricingPage';
import { RegisterPage } from './pages/RegisterPage';

const queryClient = new QueryClient();

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AnalyticsTracker />
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/grants" element={<GrantsPage />} />
            <Route path="/grants/:slug" element={<GrantDetailPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications/:id"
              element={
                <ProtectedRoute>
                  <ApplicationWorkspacePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
