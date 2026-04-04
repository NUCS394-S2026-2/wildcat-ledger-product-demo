import './App.css';

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { LedgerProvider } from './context/LedgerContext';
import { Dashboard } from './pages/Dashboard';
import { SetBudgetPage } from './pages/SetBudgetPage';

const App = () => (
  <BrowserRouter>
    <LedgerProvider>
      <Routes>
        <Route path="/" element={<SetBudgetPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LedgerProvider>
  </BrowserRouter>
);

export default App;
