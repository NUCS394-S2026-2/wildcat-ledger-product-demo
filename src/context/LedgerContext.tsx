import React, { createContext, useMemo, useState } from 'react';

import {
  BudgetAllocations,
  BudgetLine,
  FilterType,
  LedgerContextValue,
  Organization,
  Transaction,
} from '../types';
import {
  applyFilters,
  calculateBudgetLineSummaries,
  calculateOverallSummary,
} from '../utilities/calculations';

export const LedgerContext = createContext<LedgerContextValue | undefined>(undefined);

const EMPTY_ALLOCATIONS: BudgetAllocations = {
  ASG: 0,
  Operating: 0,
  Gifts: 0,
  'Debit Card': 0,
};

export const LedgerProvider = ({ children }: { children: React.ReactNode }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);
  const [selectedBudgetLine, setSelectedBudgetLine] = useState<BudgetLine | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  const activeOrganization =
    organizations.find((o) => o.id === activeOrganizationId) ?? null;

  const addOrganization = (name: string, budgetAllocations: BudgetAllocations) => {
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name,
      budgetAllocations,
      transactions: [],
    };
    setOrganizations((prev) => [...prev, newOrg]);
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    if (!activeOrganizationId) return;
    const newTransaction: Transaction = { ...transaction, id: `txn-${Date.now()}` };
    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === activeOrganizationId
          ? { ...o, transactions: [newTransaction, ...o.transactions] }
          : o,
      ),
    );
  };

  const transactions = activeOrganization?.transactions ?? [];
  const budgetAllocations = activeOrganization?.budgetAllocations ?? EMPTY_ALLOCATIONS;

  const filteredTransactions = useMemo(
    () => applyFilters(transactions, selectedBudgetLine, activeFilter),
    [transactions, selectedBudgetLine, activeFilter],
  );

  const budgetLineSummaries = useMemo(
    () => calculateBudgetLineSummaries(transactions, budgetAllocations),
    [transactions, budgetAllocations],
  );

  const overallSummary = useMemo(
    () => calculateOverallSummary(transactions, budgetAllocations),
    [transactions, budgetAllocations],
  );

  const value: LedgerContextValue = {
    organizations,
    addOrganization,
    activeOrganizationId,
    setActiveOrganizationId,
    activeOrganization,
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
