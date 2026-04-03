import React, { createContext, useMemo, useState } from 'react';

import { BudgetLine, FilterType, LedgerContextValue, Transaction } from '../types';
import {
  applyFilters,
  calculateBudgetLineSummaries,
  calculateOverallSummary,
} from '../utilities/calculations';
import { mockTransactions } from '../utilities/mockData';

export const LedgerContext = createContext<LedgerContextValue | undefined>(undefined);

export const LedgerProvider = ({ children }: { children: React.ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [selectedBudgetLine, setSelectedBudgetLine] = useState<BudgetLine | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn-${Date.now()}`,
    };
    setTransactions((prev) => [newTransaction, ...prev]);
  };

  const filteredTransactions = useMemo(
    () => applyFilters(transactions, selectedBudgetLine, activeFilter),
    [transactions, selectedBudgetLine, activeFilter],
  );

  const budgetLineSummaries = useMemo(
    () => calculateBudgetLineSummaries(transactions),
    [transactions],
  );

  const overallSummary = useMemo(
    () => calculateOverallSummary(transactions),
    [transactions],
  );

  const value: LedgerContextValue = {
    transactions,
    addTransaction,
    selectedBudgetLine,
    setSelectedBudgetLine,
    activeFilter,
    setActiveFilter,
    filteredTransactions,
    budgetLineSummaries,
    overallSummary,
  };

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
};
