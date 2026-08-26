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
import { AdminLayout } from './layouts/AdminLayout';
import { AdminCompaniesPage } from './pages/admin/AdminCompaniesPage';
import { AdminGrantFormPage } from './pages/admin/AdminGrantFormPage';
import { AdminGrantsPage } from './pages/admin/AdminGrantsPage';
import { AdminIngestionPage } from './pages/admin/AdminIngestionPage';
import { AdminPlansPage } from './pages/admin/AdminPlansPage';
import { AdminSubscriptionsPage } from './pages/admin/AdminSubscriptionsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { CompaniesDirectoryPage } from './pages/CompaniesDirectoryPage';
import { CompanyDetailPage } from './pages/CompanyDetailPage';
import { CompanyDashboardPage } from './pages/CompanyDashboardPage';
import { CreateCompanyProfilePage } from './pages/CreateCompanyProfilePage';

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
            <Route path="/companies" element={<CompaniesDirectoryPage />} />
            <Route path="/companies/:id" element={<CompanyDetailPage />} />
            <Route
              path="/company/onboarding"
              element={
                <ProtectedRoute role="company">
                  <CreateCompanyProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/dashboard"
              element={
                <ProtectedRoute role="company">
                  <CompanyDashboardPage />
                </ProtectedRoute>
              }
            />
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
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminGrantsPage />} />
              <Route path="grants" element={<AdminGrantsPage />} />
              <Route path="grants/new" element={<AdminGrantFormPage />} />
              <Route path="grants/:id" element={<AdminGrantFormPage />} />
              <Route path="plans" element={<AdminPlansPage />} />
              <Route path="companies" element={<AdminCompaniesPage />} />
              <Route path="ingestion" element={<AdminIngestionPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
