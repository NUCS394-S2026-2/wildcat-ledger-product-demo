import { useEffect, useState } from 'react';

import { useLedger } from '../hooks/useLedger';
import { Transaction } from '../types';
import { formatCurrency } from '../utilities/calculations';

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const ReconciliationModal = ({ isOpen, onClose }: ReconciliationModalProps) => {
  const { activeOrganization, reconcileTransactions } = useLedger();

  // Unreconciled debit card transactions
  const unreconciledTxns: Transaction[] = (activeOrganization?.transactions ?? []).filter(
    (t) => t.budgetLine === 'Debit Card' && t.reconciledAt == null,
  );

  // All pre-checked by default
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset selection whenever modal opens
  const unreconciledIds = unreconciledTxns.map((t) => t.id).join(',');
  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(unreconciledIds ? unreconciledIds.split(',') : []));
      setError(null);
    }
  }, [isOpen, unreconciledIds]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selected.size === 0) {
      setError('Select at least one transaction to reconcile.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reconcileTransactions([...selected]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reconciliation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const lastDate = activeOrganization?.lastReconciliationDate;

  return (
    <div className="wl-modal-root">
      <div className="wl-modal-overlay" aria-hidden="true" onClick={onClose} />
      <div
        className="wl-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recon-title"
      >
        <div className="wl-modal-header">
          <h2 id="recon-title" className="wl-modal-title">
            Reconcile Debit Card
          </h2>
          <button
            type="button"
            className="wl-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="wl-modal-body">
          <p className="wl-recon-subtitle">
            {lastDate
              ? `Showing unreconciled transactions since ${formatDate(lastDate)}.`
              : 'Showing all unreconciled debit card transactions.'}
          </p>

          {unreconciledTxns.length === 0 ? (
            <div className="wl-recon-empty">
              <span className="wl-recon-empty-icon">✓</span>
              <p>All debit card transactions are already reconciled.</p>
            </div>
          ) : (
            <>
              <div className="wl-recon-select-all">
                <label className="wl-recon-check-label">
                  <input
                    type="checkbox"
                    checked={selected.size === unreconciledTxns.length}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? new Set(unreconciledTxns.map((t) => t.id))
                          : new Set(),
                      )
                    }
                  />
                  Select all ({unreconciledTxns.length})
                </label>
              </div>

              <div className="wl-recon-list">
                {unreconciledTxns.map((t) => (
                  <label key={t.id} className="wl-recon-row">
                    <input
                      type="checkbox"
                      checked={selected.has(t.id)}
                      onChange={() => toggle(t.id)}
                    />
                    <span className="wl-recon-row-title">{t.title}</span>
                    <span className="wl-recon-row-amount">
                      {t.direction === 'Outflow' ? '−' : '+'}
                      {formatCurrency(t.amount)}
                    </span>
                  </label>
                ))}
              </div>

              {error && (
                <div className="wl-form-error" style={{ marginTop: 12 }}>
                  {error}
                </div>
              )}

              <div className="wl-recon-actions">
                <button
                  type="button"
                  className="wl-btn-primary"
                  onClick={handleConfirm}
                  disabled={submitting || selected.size === 0}
                >
                  {submitting ? 'Reconciling…' : `Confirm & Reconcile (${selected.size})`}
                </button>
                <button
                  type="button"
                  className="wl-btn-cancel"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
