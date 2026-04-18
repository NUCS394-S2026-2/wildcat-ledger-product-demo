import React, { useState } from 'react';

import { auth } from '../config/firebase';
import { useLedger } from '../hooks/useLedger';
import { PendingChange, Transaction } from '../types';
import { formatCurrency } from '../utilities/calculations';
import { TransactionModal } from './TransactionModal';

const TransactionRow = ({
  t,
  canEdit,
  pending,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: {
  t: Transaction;
  canEdit: boolean;
  pending: PendingChange | undefined;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
  onApprove: (pendingId: string) => void;
  onReject: (pendingId: string) => void;
}) => {
  const isInflow = t.direction === 'Inflow';
  const currentEmail = auth.currentUser?.email;
  const isMyPending = !!pending && pending.requestedBy === currentEmail;
  const canApprove = !!pending && !isMyPending && canEdit;

  return (
    <tr className={pending ? 'wl-row--pending' : ''}>
      <td className="wl-td wl-td-title">
        <span className="wl-td-title-text">{t.title}</span>
        {pending && (
          <span className="wl-pending-type-badge">
            {pending.type === 'delete' ? 'Delete requested' : 'Edit requested'}
          </span>
        )}
      </td>
      <td
        className={`wl-td wl-td-amount ${isInflow ? 'wl-amount-positive' : 'wl-amount-negative'}`}
      >
        {isInflow ? '+' : '-'}
        {formatCurrency(t.amount)}
      </td>
      <td className="wl-td wl-td-type">{t.type}</td>
      <td className="wl-td wl-td-budget">
        <span className="wl-budget-chip">{t.budgetLine}</span>
      </td>
      {canEdit && (
        <td className="wl-td wl-td-actions">
          {pending ? (
            isMyPending ? (
              <span className="wl-pending-badge">Awaiting Approval</span>
            ) : canApprove ? (
              <div className="wl-approve-actions">
                <button
                  type="button"
                  className="wl-btn-approve"
                  onClick={() => onApprove(pending.id)}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="wl-btn-reject"
                  onClick={() => onReject(pending.id)}
                >
                  Reject
                </button>
              </div>
            ) : null
          ) : (
            <>
              <button
                type="button"
                className="wl-action-btn"
                onClick={() => onEdit(t)}
                aria-label="Edit transaction"
              >
                ✎
              </button>
              <button
                type="button"
                className="wl-action-btn wl-action-btn--delete"
                onClick={() => onDelete(t)}
                aria-label="Delete transaction"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </>
          )}
        </td>
      )}
    </tr>
  );
};

export const TransactionList = () => {
  const {
    filteredTransactions,
    deleteTransaction,
    userRole,
    pendingChanges,
    approvePendingChange,
    rejectPendingChange,
  } = useLedger();
  const canEdit = userRole === 'treasurer' || userRole === 'president';
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(
    null,
  );

  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;
    await deleteTransaction(deletingTransaction.id);
    setDeletingTransaction(null);
  };

  if (filteredTransactions.length === 0) {
    return (
      <div className="wl-card wl-empty-state">
        <p>No transactions match this filter.</p>
      </div>
    );
  }

  return (
    <>
      <div className="wl-card wl-table-card">
        <div className="wl-table-wrap">
          <table className="wl-table" aria-label="Transactions">
            <thead>
              <tr>
                <th className="wl-th">Title</th>
                <th className="wl-th">Amount</th>
                <th className="wl-th">Type</th>
                <th className="wl-th">Budget Line</th>
                {canEdit && <th className="wl-th">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => (
                <React.Fragment key={t.id}>
                  <TransactionRow
                    t={t}
                    canEdit={canEdit}
                    pending={pendingChanges.find((p) => p.transactionId === t.id)}
                    onEdit={setEditingTransaction}
                    onDelete={setDeletingTransaction}
                    onApprove={approvePendingChange}
                    onReject={rejectPendingChange}
                  />
                  {deletingTransaction?.id === t.id && (
                    <tr className="wl-delete-confirm-row">
                      <td colSpan={canEdit ? 5 : 4} className="wl-delete-confirm-cell">
                        <div className="wl-inline-confirm wl-inline-confirm--inline">
                          <p>
                            Submit a delete request for <strong>{t.title}</strong>? The
                            other approver will need to confirm before it is removed.
                          </p>
                          <div className="wl-overdraft-actions">
                            <button
                              type="button"
                              className="wl-btn-warning"
                              style={{ background: '#dc2626' }}
                              onClick={handleDeleteConfirm}
                            >
                              Submit Request
                            </button>
                            <button
                              type="button"
                              className="wl-btn-cancel"
                              onClick={() => setDeletingTransaction(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        existingTransaction={editingTransaction ?? undefined}
      />
    </>
  );
};
