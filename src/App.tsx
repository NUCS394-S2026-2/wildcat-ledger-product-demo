import './App.css';

import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { LedgerProvider } from './context/LedgerContext';
import { useAuth } from './hooks/useAuth';
import { AuditLogPage } from './pages/AuditLogPage';
import { CreateOrganization } from './pages/CreateOrganization';
import { DashboardOptionB } from './pages/DashboardOptionB';
import { LoginPage } from './pages/LoginPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { UploadReceiptPage } from './pages/UploadReceiptPage';
const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <LedgerProvider>
      <Outlet />
    </LedgerProvider>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/upload-receipt" element={<UploadReceiptPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/organizations" element={<OrganizationsPage />} />
          <Route path="/budget-setup" element={<CreateOrganization />} />
          <Route path="/dashboard" element={<DashboardOptionB />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
