import { useState } from 'react';

import { useLedger } from '../hooks/useLedger';
import { Transaction } from '../types';
import {
  formatCurrency,
  getMissingRequirements,
  isTransactionFlagged,
} from '../utilities/calculations';
import { StatusBadge } from './StatusBadge';
import { TransactionModal } from './TransactionModal';

const TransactionRow = ({
  t,
  onEdit,
  onDelete,
}: {
  t: Transaction;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}) => {
  const isInflow = t.direction === 'Inflow';
  const flagged = isTransactionFlagged(t);
  const missing = getMissingRequirements(t);

  return (
    <tr className={flagged ? 'wl-row--flagged' : ''}>
      <td className="wl-td wl-td-date">{t.date}</td>
      <td className="wl-td wl-td-title">
        <span className="wl-td-title-text">{t.title}</span>
        {t.notes && <span className="wl-td-notes">{t.notes}</span>}
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
      <td className="wl-td wl-td-person">{t.person}</td>
      <td className="wl-td">
        <StatusBadge status={t.status} />
      </td>
      <td className="wl-td wl-td-flags">
        {missing.length > 0 ? (
          <div className="wl-flag-tags">
            {missing.map((m) => (
              <span key={m} className="wl-flag-tag">
                {m}
              </span>
            ))}
          </div>
        ) : (
          <span className="wl-td-ok">✓</span>
        )}
      </td>
      <td className="wl-td wl-td-actions">
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
          ✕
        </button>
      </td>
    </tr>
  );
};

export const TransactionList = () => {
  const { filteredTransactions, deleteTransaction } = useLedger();
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
                <th className="wl-th">Date</th>
                <th className="wl-th">Title</th>
                <th className="wl-th">Amount</th>
                <th className="wl-th">Type</th>
                <th className="wl-th">Budget Line</th>
                <th className="wl-th">Person</th>
                <th className="wl-th">Status</th>
                <th className="wl-th">Requirements</th>
                <th className="wl-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => (
                <TransactionRow
                  key={t.id}
                  t={t}
                  onEdit={setEditingTransaction}
                  onDelete={setDeletingTransaction}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deletingTransaction && (
        <div className="wl-inline-confirm">
          <p>
            Delete <strong>{deletingTransaction.title}</strong>? This cannot be undone.
          </p>
          <div className="wl-overdraft-actions">
            <button
              type="button"
              className="wl-btn-warning"
              style={{ background: '#dc2626' }}
              onClick={handleDeleteConfirm}
            >
              Delete
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
      )}

      <TransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        existingTransaction={editingTransaction ?? undefined}
      />
    </>
  );
};
