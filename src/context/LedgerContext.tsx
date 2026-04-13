import { onAuthStateChanged } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import React, { createContext, useEffect, useMemo, useState } from 'react';

import { auth, db } from '../config/firebase';
import {
  BudgetAllocations,
  BudgetLine,
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
  const [activeOrganizationId, setActiveOrganizationIdState] = useState<string | null>(
    () => localStorage.getItem('activeOrganizationId'),
  );

  const setActiveOrganizationId = (id: string) => {
    localStorage.setItem('activeOrganizationId', id);
    setActiveOrganizationIdState(id);
  };
  const [selectedBudgetLine, setSelectedBudgetLine] = useState<BudgetLine | null>(null);

  // Load clubs from Firestore where the logged-in user is an admin.
  // Re-runs whenever the auth user changes.
  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    let previousEmail: string | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      const userEmail = firebaseUser?.email ?? null;

      // Clean up any previous snapshot listener
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }

      // If the user changed, clear the active org so they go through org selection
      if (userEmail !== previousEmail) {
        previousEmail = userEmail;
        localStorage.removeItem('activeOrganizationId');
        setActiveOrganizationIdState(null);
        setOrganizations([]);
      }

      if (!userEmail) return;

      const orgsRef = collection(db, 'clubs');
      unsubSnapshot = onSnapshot(orgsRef, async (snapshot) => {
        const orgs: Organization[] = await Promise.all(
          snapshot.docs
            .filter((doc) => {
              const admins: string[] = doc.data().admins ?? [];
              return admins.includes(userEmail);
            })
            .map(async (doc) => {
              const data = doc.data();
              const txnsSnap = await getDocs(
                collection(db, 'clubs', doc.id, 'transactions'),
              );
              const transactions: Transaction[] = txnsSnap.docs.map((t) => ({
                id: t.id,
                ...(t.data() as Omit<Transaction, 'id'>),
              }));
              return {
                id: doc.id,
                name: data.name as string,
                admins: (data.admins ?? []) as string[],
                budgetAllocations: data.budgetAllocations as BudgetAllocations,
                isBudgetLineSet: (data.isBudgetLineSet as boolean) ?? false,
                transactions,
              };
            }),
        );
        setOrganizations(orgs);
      });
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  // When active org changes, subscribe to its transactions in real-time
  useEffect(() => {
    if (!activeOrganizationId) return;
    const txnsRef = collection(db, 'clubs', activeOrganizationId, 'transactions');
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
    const duplicate = organizations.some(
      (o) => o.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    if (duplicate) {
      throw new Error(`An organization named "${name}" already exists.`);
    }
    await setDoc(doc(db, 'clubs', name), {
      name,
      budgetAllocations,
    });
    // onSnapshot above will update local state automatically
  };

  const applyDelta = (
    orgId: string,
    line: BudgetLine,
    direction: string,
    amount: number,
  ) => {
    const delta = direction === 'Inflow' ? amount : -amount;
    return updateDoc(doc(db, 'clubs', orgId), {
      [`budgetAllocations.${line}`]: increment(delta),
    });
  };

  const reverseDelta = (
    orgId: string,
    line: BudgetLine,
    direction: string,
    amount: number,
  ) => {
    const delta = direction === 'Inflow' ? -amount : amount;
    return updateDoc(doc(db, 'clubs', orgId), {
      [`budgetAllocations.${line}`]: increment(delta),
    });
  };

  // Firestore rejects undefined field values — strip them before every write.
  const toFirestore = (transaction: Omit<Transaction, 'id'>) =>
    Object.fromEntries(Object.entries(transaction).filter(([, v]) => v !== undefined));

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!activeOrganizationId) return;
    const txnsRef = collection(db, 'clubs', activeOrganizationId, 'transactions');
    await addDoc(txnsRef, toFirestore(transaction));
    await applyDelta(
      activeOrganizationId,
      transaction.budgetLine,
      transaction.direction,
      transaction.amount,
    );
  };

  const updateTransaction = async (id: string, transaction: Omit<Transaction, 'id'>) => {
    if (!activeOrganizationId) return;
    const old = activeOrganization?.transactions.find((t) => t.id === id);
    const txnRef = doc(db, 'clubs', activeOrganizationId, 'transactions', id);
    await updateDoc(txnRef, toFirestore(transaction));
    if (old)
      await reverseDelta(activeOrganizationId, old.budgetLine, old.direction, old.amount);
    await applyDelta(
      activeOrganizationId,
      transaction.budgetLine,
      transaction.direction,
      transaction.amount,
    );
  };

  const deleteTransaction = async (id: string) => {
    if (!activeOrganizationId) return;
    const old = activeOrganization?.transactions.find((t) => t.id === id);
    const txnRef = doc(db, 'clubs', activeOrganizationId, 'transactions', id);
    await deleteDoc(txnRef);
    if (old)
      await reverseDelta(activeOrganizationId, old.budgetLine, old.direction, old.amount);
  };

  const updateBudgetAllocations = async (allocations: BudgetAllocations) => {
    if (!activeOrganizationId) return;
    const orgRef = doc(db, 'clubs', activeOrganizationId);
    await updateDoc(orgRef, { budgetAllocations: allocations });
  };

  // Sets the initial budget allocations and locks the flag so it cannot be
  // done again through the normal onboarding flow.
  const initializeBudgetAllocations = async (allocations: BudgetAllocations) => {
    if (!activeOrganizationId) return;
    const orgRef = doc(db, 'clubs', activeOrganizationId);
    await updateDoc(orgRef, { budgetAllocations: allocations, isBudgetLineSet: true });
  };

  const activeOrganization =
    organizations.find((o: Organization) => o.id === activeOrganizationId) ?? null;

  const transactions = activeOrganization?.transactions ?? [];
  const budgetAllocations = activeOrganization?.budgetAllocations ?? EMPTY_ALLOCATIONS;

  const filteredTransactions = useMemo(
    () => applyFilters(transactions, selectedBudgetLine),
    [transactions, selectedBudgetLine],
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
    updateBudgetAllocations,
    initializeBudgetAllocations,
    selectedBudgetLine,
    setSelectedBudgetLine,
    filteredTransactions,
    budgetLineSummaries,
    overallSummary,
  };

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
};
