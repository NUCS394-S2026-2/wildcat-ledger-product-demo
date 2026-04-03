import './App.css';

import { useRef, useState } from 'react';

import { ActivityFeed } from './components/ActivityFeed';
import { BudgetLineSummary } from './components/BudgetLineSummary';
import { FilterBar } from './components/FilterBar';
import { Header } from './components/Header';
import { SummaryProgressBars } from './components/SummaryProgressBars';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { LedgerProvider } from './context/LedgerContext';

const Dashboard = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const scrollToTable = () => {
    tableRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="wl-app">
      <Header onAddTransaction={() => setModalOpen(true)} />
      <main className="wl-main">
        <SummaryProgressBars />
        <BudgetLineSummary />
        <ActivityFeed onViewAll={scrollToTable} />
        <div ref={tableRef}>
          <FilterBar />
        </div>
        <TransactionList />
      </main>
      <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

const App = () => (
  <LedgerProvider>
    <Dashboard />
  </LedgerProvider>
);

export default App;
