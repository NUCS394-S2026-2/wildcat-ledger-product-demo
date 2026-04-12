import { useState } from 'react';

import { useLedger } from '../hooks/useLedger';
import { Transaction } from '../types';
import { formatCurrency } from '../utilities/calculations';
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

  return (
    <tr>
      <td className="wl-td wl-td-title">
        <span className="wl-td-title-text">{t.title}</span>
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
                <th className="wl-th">Title</th>
                <th className="wl-th">Amount</th>
                <th className="wl-th">Type</th>
                <th className="wl-th">Budget Line</th>
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
