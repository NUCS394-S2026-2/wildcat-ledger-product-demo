import { useState } from 'react';

import { BudgetLineSummary } from '../components/BudgetLineSummary';
import { FilterBar } from '../components/FilterBar';
import { Header } from '../components/Header';
import { TransactionList } from '../components/TransactionList';
import { TransactionModal } from '../components/TransactionModal';

export const Dashboard = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="wl-app">
      <Header onAddTransaction={() => setModalOpen(true)} />
      <main className="wl-main">
        <BudgetLineSummary />
        <FilterBar />
        <TransactionList />
      </main>
      <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
