import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BudgetLineSummary } from '../components/BudgetLineSummary';
import { FilterBar } from '../components/FilterBar';
import { Header } from '../components/Header';
import { TransactionList } from '../components/TransactionList';
import { TransactionModal } from '../components/TransactionModal';

export const Dashboard = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="wl-app">
      <Header onAddTransaction={() => setModalOpen(true)} />
      <div className="wl-main" style={{ paddingBottom: 0, paddingTop: 16 }}>
        <button type="button" className="wl-btn-back" onClick={() => navigate('/')}>
          ← Back to Organizations
        </button>
      </div>
      <main className="wl-main">
        <BudgetLineSummary />
        <FilterBar />
        <TransactionList />
      </main>
      <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
