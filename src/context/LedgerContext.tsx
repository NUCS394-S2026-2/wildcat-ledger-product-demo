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
  AuditAction,
  AuditEntry,
  BudgetAllocations,
  BudgetLine,
  LedgerContextValue,
  Organization,
  PendingChange,
  Transaction,
  UserRole,
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
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
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
              const data = doc.data();
              const admins: string[] = data.admins ?? [];
              const officers: string[] = data.officers ?? [];
              const treasurers: string[] = data.treasurers ?? [];
              const presidents: string[] = data.presidents ?? [];
              return (
                admins.includes(userEmail) ||
                treasurers.includes(userEmail) ||
                presidents.includes(userEmail) ||
                officers.includes(userEmail)
              );
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
                treasurer: (data.treasurers ?? []) as string[],
                president: (data.presidents ?? []) as string[],
                officers: (data.officers ?? []) as string[],
                budgetAllocations: data.budgetAllocations as BudgetAllocations,
                isBudgetLinesSet: (data.isBudgetLinesSet as boolean) ?? false,
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

  // When active org changes, subscribe to its transactions and audit log in real-time
  useEffect(() => {
    if (!activeOrganizationId) return;

    const txnsRef = collection(db, 'clubs', activeOrganizationId, 'transactions');
    const unsubTxns = onSnapshot(txnsRef, (snapshot) => {
      const transactions: Transaction[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Transaction, 'id'>),
      }));
      setOrganizations((prev) =>
        prev.map((o) => (o.id === activeOrganizationId ? { ...o, transactions } : o)),
      );
    });

    const auditRef = collection(db, 'clubs', activeOrganizationId, 'auditLog');
    const unsubAudit = onSnapshot(auditRef, (snapshot) => {
      const entries: AuditEntry[] = snapshot.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<AuditEntry, 'id'>) }))
        .sort((a, b) => b.timestamp - a.timestamp);
      setAuditLog(entries);
    });

    const pendingRef = collection(db, 'clubs', activeOrganizationId, 'pendingChanges');
    const unsubPending = onSnapshot(pendingRef, (snapshot) => {
      const changes: PendingChange[] = snapshot.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<PendingChange, 'id'>) }))
        .sort((a, b) => b.requestedAt - a.requestedAt);
      setPendingChanges(changes);
    });

    return () => {
      unsubTxns();
      unsubAudit();
      unsubPending();
    };
  }, [activeOrganizationId]);

  const writeAuditEntry = async (
    action: AuditAction,
    transactionId: string,
    transactionTitle: string,
    before: Omit<Transaction, 'id'> | null,
    after: Omit<Transaction, 'id'> | null,
  ) => {
    if (!activeOrganizationId) return;
    const userEmail = auth.currentUser?.email ?? 'unknown';
    await addDoc(collection(db, 'clubs', activeOrganizationId, 'auditLog'), {
      action,
      performedBy: userEmail,
      timestamp: Date.now(),
      transactionId,
      transactionTitle,
      before: before ? toFirestore(before) : null,
      after: after ? toFirestore(after) : null,
    });
  };

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

  const omitId = (t: Transaction): Omit<Transaction, 'id'> => {
    const { id: omitted, ...rest } = t;
    void omitted;
    return rest;
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!activeOrganizationId) return;
    const txnsRef = collection(db, 'clubs', activeOrganizationId, 'transactions');
    const ref = await addDoc(txnsRef, toFirestore(transaction));
    await applyDelta(
      activeOrganizationId,
      transaction.budgetLine,
      transaction.direction,
      transaction.amount,
    );
    await writeAuditEntry('create', ref.id, transaction.title, null, transaction);
  };

  const updateTransaction = async (id: string, transaction: Omit<Transaction, 'id'>) => {
    if (!activeOrganizationId) return;
    const role = userRole;
    if (role !== 'treasurer' && role !== 'president') return;
    const old = activeOrganization?.transactions.find((t) => t.id === id);
    if (!old) return;
    await addDoc(collection(db, 'clubs', activeOrganizationId, 'pendingChanges'), {
      type: 'edit',
      transactionId: id,
      transactionTitle: transaction.title,
      requestedBy: auth.currentUser?.email ?? 'unknown',
      requestedByRole: role,
      requestedAt: Date.now(),
      before: toFirestore(omitId(old)),
      after: toFirestore(transaction),
    });
  };

  const deleteTransaction = async (id: string) => {
    if (!activeOrganizationId) return;
    const role = userRole;
    if (role !== 'treasurer' && role !== 'president') return;
    const old = activeOrganization?.transactions.find((t) => t.id === id);
    if (!old) return;
    await addDoc(collection(db, 'clubs', activeOrganizationId, 'pendingChanges'), {
      type: 'delete',
      transactionId: id,
      transactionTitle: old.title,
      requestedBy: auth.currentUser?.email ?? 'unknown',
      requestedByRole: role,
      requestedAt: Date.now(),
      before: toFirestore(omitId(old)),
      after: null,
    });
  };

  const approvePendingChange = async (pendingId: string) => {
    if (!activeOrganizationId) return;
    const pending = pendingChanges.find((p) => p.id === pendingId);
    if (!pending) return;
    const pendingRef = doc(
      db,
      'clubs',
      activeOrganizationId,
      'pendingChanges',
      pendingId,
    );
    if (pending.type === 'edit' && pending.after) {
      const txnRef = doc(
        db,
        'clubs',
        activeOrganizationId,
        'transactions',
        pending.transactionId,
      );
      await updateDoc(txnRef, toFirestore(pending.after));
      await reverseDelta(
        activeOrganizationId,
        pending.before.budgetLine,
        pending.before.direction,
        pending.before.amount,
      );
      await applyDelta(
        activeOrganizationId,
        pending.after.budgetLine,
        pending.after.direction,
        pending.after.amount,
      );
      await writeAuditEntry(
        'edit',
        pending.transactionId,
        pending.transactionTitle,
        pending.before,
        pending.after,
      );
    } else if (pending.type === 'delete') {
      const txnRef = doc(
        db,
        'clubs',
        activeOrganizationId,
        'transactions',
        pending.transactionId,
      );
      await deleteDoc(txnRef);
      await reverseDelta(
        activeOrganizationId,
        pending.before.budgetLine,
        pending.before.direction,
        pending.before.amount,
      );
      await writeAuditEntry(
        'delete',
        pending.transactionId,
        pending.transactionTitle,
        pending.before,
        null,
      );
    }
    await deleteDoc(pendingRef);
  };

  const rejectPendingChange = async (pendingId: string) => {
    if (!activeOrganizationId) return;
    const pendingRef = doc(
      db,
      'clubs',
      activeOrganizationId,
      'pendingChanges',
      pendingId,
    );
    await deleteDoc(pendingRef);
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
    await updateDoc(orgRef, { budgetAllocations: allocations, isBudgetLinesSet: true });
  };

  const activeOrganization =
    organizations.find((o: Organization) => o.id === activeOrganizationId) ?? null;

  const userRole = ((): UserRole | null => {
    const email = auth.currentUser?.email;
    if (!email || !activeOrganization) return null;
    if (activeOrganization.treasurer?.includes(email)) return 'treasurer';
    if (activeOrganization.president?.includes(email)) return 'president';
    if (activeOrganization.officers?.includes(email)) return 'officer';
    if (activeOrganization.admins?.includes(email)) return 'treasurer';
    return null;
  })();

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
    auditLog,
    pendingChanges,
    organizations,
    addOrganization,
    activeOrganizationId,
    setActiveOrganizationId,
    activeOrganization,
    userRole,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    approvePendingChange,
    rejectPendingChange,
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
