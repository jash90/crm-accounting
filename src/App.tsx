import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useAuthStore } from '@/stores/auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { AcceptInvitePage } from '@/pages/AcceptInvitePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ModulesPage } from '@/pages/ModulesPage';
import { InvitesPage } from '@/pages/InvitesPage';
import { ContactsPage } from '@/modules/contacts';
import { ClientsPage, AddClientPage, EditClientPage } from '@/modules/clients';
import { 
  OfferWizard, 
  OfferView, 
  OfferLanding, 
  OffersTable,
  Checklists,
  PriceListManager
} from '@/modules/offers';
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
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
            <Route path="dashboard" element={<DashboardPage />} />
            <Route 
              path="contacts" 
              element={<ContactsPage />}
            />
            <Route 
              path="clients" 
              element={<ClientsPage />}
            />
            <Route 
              path="clients/add" 
              element={<AddClientPage />}
            />
            <Route 
              path="clients/:id/edit" 
              element={<EditClientPage />}
            />
            <Route path="offers" element={<OffersTable />} />
            <Route path="offers/new" element={<OfferWizard />} />
            <Route path="offers/:id" element={<OfferView />} />
            <Route path="price-list" element={<PriceListManager />} />
            <Route path="clients/:id/checklists" element={<Checklists />} />
            <Route path="modules" element={<ModulesPage />} />
            <Route 
              path="invites" 
              element={
                <ProtectedRoute requiredRole="OWNER">
                  <InvitesPage />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Public offer acceptance route */}
          <Route path="/offer/:token" element={<OfferLanding />} />

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
          theme="light"
        />
      </div>
    </Router>
  );
}

export default App;