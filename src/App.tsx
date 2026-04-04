import './App.css';

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { LedgerProvider } from './context/LedgerContext';
import { CreateOrganization } from './pages/CreateOrganization';
import { Dashboard } from './pages/Dashboard';
import { OrganizationsPage } from './pages/OrganizationsPage';

const App = () => (
  <BrowserRouter>
    <LedgerProvider>
      <Routes>
        <Route path="/" element={<OrganizationsPage />} />
        <Route path="/setup" element={<CreateOrganization />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LedgerProvider>
  </BrowserRouter>
);

export default App;
