import './App.css';

import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { LedgerProvider } from './context/LedgerContext';
import { useAuth } from './hooks/useAuth';
import { CreateOrganization } from './pages/CreateOrganization';
import { Dashboard } from './pages/Dashboard';
import { LoginPage } from './pages/LoginPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { Settings } from './pages/Settings';

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
        <Route element={<ProtectedLayout />}>
          <Route path="/organizations" element={<OrganizationsPage />} />
          <Route path="/budget-setup" element={<CreateOrganization />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
