import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { UnsavedChangesProvider } from './contexts/UnsavedChangesContext';
import { initializeMockData } from './services/mockDataService';

import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';
import { CustomerRoute } from './routes/CustomerRoute';
import { MainLayout } from './components/layout/MainLayout';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';

import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { CustomerDashboard } from './pages/dashboard/CustomerDashboard';

import { CustomersPage } from './pages/customers/CustomersPage';
import { CustomerDetailsPage } from './pages/customers/CustomerDetailsPage';
import { PlansPage } from './pages/plans/PlansPage';
import { CustomerPlansPage } from './pages/plans/CustomerPlansPage';
import { SubscriptionsPage } from './pages/subscriptions/SubscriptionsPage';
import { InvoicesPage } from './pages/invoices/InvoicesPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { SupportPage } from './pages/support/SupportPage';

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'Admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/customer/dashboard" replace />;
};

export const AppContent: React.FC = () => {
  useEffect(() => {
    initializeMockData();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Admin Protected Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<MainLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:id" element={<CustomerDetailsPage />} />
              <Route path="plans" element={<PlansPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Customer Protected Routes */}
          <Route element={<CustomerRoute />}>
            <Route path="/customer" element={<MainLayout />}>
              <Route path="dashboard" element={<CustomerDashboard />} />
              <Route path="plans" element={<CustomerPlansPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="support" element={<SupportPage />} />
            </Route>
          </Route>
        </Route>

        {/* Root Fallback */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <NotificationProvider>
            <UnsavedChangesProvider>
              <AppContent />
            </UnsavedChangesProvider>
          </NotificationProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
