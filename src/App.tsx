import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useAuthStore } from '@/stores/auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { PageLoading } from '@/components/shared/loading-spinner';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { AcceptInvitePage } from '@/pages/AcceptInvitePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ModulesPage } from '@/pages/ModulesPage';
import { InvitesPage } from '@/pages/InvitesPage';
import {
  ClientsPage,
  AddClientPage,
  EditClientPage,
  ClientViewPage,
} from '@/modules/clients';
import { AccessDeniedPage } from '@/pages/AccessDeniedPage';

// Styles
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { initialize, initialized, loading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show loading screen while initializing auth
  if (!initialized || loading) {
    return <PageLoading message="Loading application..." />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/invite" element={<AcceptInvitePage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={
              <ErrorBoundary>
                <DashboardPage />
              </ErrorBoundary>
            } />

            <Route path="clients" element={
              <ErrorBoundary>
                <ClientsPage />
              </ErrorBoundary>
            } />
            <Route path="clients/add" element={
              <ErrorBoundary>
                <AddClientPage />
              </ErrorBoundary>
            } />
            <Route path="clients/:id" element={
              <ErrorBoundary>
                <ClientViewPage />
              </ErrorBoundary>
            } />
            <Route path="clients/:id/edit" element={
              <ErrorBoundary>
                <EditClientPage />
              </ErrorBoundary>
            } />

            <Route path="modules" element={
              <ErrorBoundary>
                <ModulesPage />
              </ErrorBoundary>
            } />
            <Route
              path="invites"
              element={
                <ProtectedRoute requiredRole="OWNER">
                  <ErrorBoundary>
                    <InvitesPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          {/* Toast notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={
              document.documentElement.classList.contains('dark')
                ? 'dark'
                : 'light'
            }
          />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
