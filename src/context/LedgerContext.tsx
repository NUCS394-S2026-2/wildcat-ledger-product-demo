import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import React, { createContext, useEffect, useMemo, useState } from 'react';

import { db } from '../config/firebase';
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

  // Load all clubs from Firestore on mount
  useEffect(() => {
    const orgsRef = collection(db, 'clubs');
    const unsub = onSnapshot(orgsRef, async (snapshot) => {
      const orgs: Organization[] = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const txnsSnap = await getDocs(
            query(
              collection(db, 'clubs', doc.id, 'transactions'),
              orderBy('date', 'desc'),
            ),
          );
          const transactions: Transaction[] = txnsSnap.docs.map((t) => ({
            id: t.id,
            ...(t.data() as Omit<Transaction, 'id'>),
          }));
          return {
            id: doc.id,
            name: data.name as string,
            budgetAllocations: data.budgetAllocations as BudgetAllocations,
            transactions,
          };
        }),
      );
      setOrganizations(orgs);
    });
    return () => unsub();
  }, []);

  // When active org changes, subscribe to its transactions in real-time
  useEffect(() => {
    if (!activeOrganizationId) return;
    const txnsRef = query(
      collection(db, 'clubs', activeOrganizationId, 'transactions'),
      orderBy('date', 'desc'),
    );
    const unsub = onSnapshot(txnsRef, (snapshot) => {
      const transactions: Transaction[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Transaction, 'id'>),
      }));
      setOrganizations((prev) =>
        prev.map((o) => (o.id === activeOrganizationId ? { ...o, transactions } : o)),
      );
    });
    return () => unsub();
  }, [activeOrganizationId]);

  const addOrganization = async (name: string, budgetAllocations: BudgetAllocations) => {
    await setDoc(doc(db, 'clubs', name), {
      name,
      budgetAllocations,
    });
    // onSnapshot above will update local state automatically
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!activeOrganizationId) return;
    const txnsRef = collection(db, 'clubs', activeOrganizationId, 'transactions');
    await addDoc(txnsRef, transaction);
  };

  const updateTransaction = async (id: string, transaction: Omit<Transaction, 'id'>) => {
    if (!activeOrganizationId) return;
    const txnRef = doc(db, 'clubs', activeOrganizationId, 'transactions', id);
    await updateDoc(txnRef, { ...transaction });
  };

  const deleteTransaction = async (id: string) => {
    if (!activeOrganizationId) return;
    const txnRef = doc(db, 'clubs', activeOrganizationId, 'transactions', id);
    await deleteDoc(txnRef);
  };

  const activeOrganization =
    organizations.find((o: Organization) => o.id === activeOrganizationId) ?? null;

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
    updateTransaction,
    deleteTransaction,
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
