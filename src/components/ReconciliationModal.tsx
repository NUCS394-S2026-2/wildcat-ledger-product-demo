import { useEffect, useRef, useState } from 'react';

import { useLedger } from '../hooks/useLedger';
import { Transaction } from '../types';
import { formatCurrency } from '../utilities/calculations';
import { downloadReceiptsZip } from '../utilities/downloadReceiptsZip';

// Northwestern Policy Exemption Request Form
const EXEMPTION_FORM_URL =
  'https://www.northwestern.edu/financial-operations/forms-policies/forms/policy-exemption-request.html';

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
  const { activeOrganization, reconcileTransactions, uploadExemptionForm } = useLedger();

  // Unreconciled debit card transactions
  const unreconciledTxns: Transaction[] = (activeOrganization?.transactions ?? []).filter(
    (t) => t.budgetLine === 'Debit Card' && t.reconciledAt == null,
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});
  const [zipping, setZipping] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Reset selection whenever modal opens
  const unreconciledIds = unreconciledTxns.map((t) => t.id).join(',');
  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(unreconciledIds ? unreconciledIds.split(',') : []));
      setError(null);
      setUploading({});
      setUploadError({});
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

  // Selected transactions that have neither a receipt nor an exemption form
  const uncoveredSelected = unreconciledTxns.filter(
    (t) => selected.has(t.id) && !t.receiptFileUrl && !t.exemptionFormUrl,
  );
  const canConfirm = selected.size > 0 && uncoveredSelected.length === 0;

  const handleFileChange = async (txnId: string, file: File | null) => {
    if (!file) return;
    setUploading((prev) => ({ ...prev, [txnId]: true }));
    setUploadError((prev) => ({ ...prev, [txnId]: '' }));
    try {
      await uploadExemptionForm(txnId, file);
    } catch (err) {
      setUploadError((prev) => ({
        ...prev,
        [txnId]: err instanceof Error ? err.message : 'Upload failed.',
      }));
    } finally {
      setUploading((prev) => ({ ...prev, [txnId]: false }));
    }
  };

  const handleConfirm = async () => {
    if (selected.size === 0) {
      setError('Select at least one transaction to reconcile.');
      return;
    }
    if (uncoveredSelected.length > 0) {
      setError(
        `${uncoveredSelected.length} selected transaction(s) are missing a receipt or exemption form.`,
      );
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

  const handleDownloadZip = async () => {
    setZipping(true);
    try {
      await downloadReceiptsZip(unreconciledTxns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate ZIP.');
    } finally {
      setZipping(false);
    }
  };

  if (!isOpen) return null;

  const lastDate = activeOrganization?.lastReconciliationDate;
  const txnsWithReceipts = unreconciledTxns.filter((t) => t.receiptFileUrl);

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
                {unreconciledTxns.map((t) => {
                  const isSelected = selected.has(t.id);
                  const isCovered = !!(t.receiptFileUrl || t.exemptionFormUrl);
                  const isMissing = isSelected && !isCovered;

                  return (
                    <div
                      key={t.id}
                      className={`wl-recon-item${isMissing ? ' wl-recon-item--warning' : ''}`}
                    >
                      {/* Main row — label wraps only the checkbox + title + badges */}
                      <label className="wl-recon-row">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggle(t.id)}
                        />
                        <span className="wl-recon-row-title">{t.title}</span>
                        {t.receiptFileUrl && (
                          <span
                            className="wl-recon-badge wl-recon-badge--ok"
                            title="Receipt uploaded"
                          >
                            🧾
                          </span>
                        )}
                        {t.exemptionFormUrl && (
                          <span
                            className="wl-recon-badge wl-recon-badge--ok"
                            title="Exemption form attached"
                          >
                            📋
                          </span>
                        )}
                        {isMissing && (
                          <span
                            className="wl-recon-badge wl-recon-badge--warn"
                            title="Missing receipt or exemption form"
                          >
                            ⚠
                          </span>
                        )}
                        <span className="wl-recon-row-amount">
                          {t.direction === 'Outflow' ? '−' : '+'}
                          {formatCurrency(t.amount)}
                        </span>
                      </label>

                      {/* Missing receipt sub-panel */}
                      {isMissing && (
                        <div className="wl-recon-missing">
                          <p className="wl-recon-missing-msg">
                            No receipt on file.{' '}
                            <a
                              href={EXEMPTION_FORM_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="wl-recon-exemption-link"
                            >
                              Submit Policy Exemption Request Form ↗
                            </a>
                          </p>
                          <div className="wl-recon-upload-row">
                            <input
                              ref={(el) => {
                                fileInputRefs.current[t.id] = el;
                              }}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              style={{ display: 'none' }}
                              onChange={(e) =>
                                handleFileChange(t.id, e.target.files?.[0] ?? null)
                              }
                            />
                            <button
                              type="button"
                              className="wl-btn-upload-exemption"
                              onClick={() => fileInputRefs.current[t.id]?.click()}
                              disabled={uploading[t.id]}
                            >
                              {uploading[t.id]
                                ? 'Uploading…'
                                : '↑ Attach Completed Exemption Form'}
                            </button>
                            {uploadError[t.id] && (
                              <span className="wl-recon-upload-error">
                                {uploadError[t.id]}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {uncoveredSelected.length > 0 && (
                <div className="wl-recon-block-warning">
                  ⚠ {uncoveredSelected.length} selected transaction
                  {uncoveredSelected.length !== 1 ? 's' : ''} need
                  {uncoveredSelected.length === 1 ? 's' : ''} a receipt or exemption form
                  before reconciling.
                </div>
              )}

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
                  disabled={submitting || !canConfirm}
                  title={
                    uncoveredSelected.length > 0
                      ? `${uncoveredSelected.length} transaction(s) need a receipt or exemption form`
                      : undefined
                  }
                >
                  {submitting ? 'Reconciling…' : `Confirm & Reconcile (${selected.size})`}
                </button>
                {txnsWithReceipts.length > 0 && (
                  <button
                    type="button"
                    className="wl-btn-download-zip"
                    onClick={handleDownloadZip}
                    disabled={zipping}
                  >
                    {zipping
                      ? 'Bundling…'
                      : `⬇ Receipts ZIP (${txnsWithReceipts.length})`}
                  </button>
                )}
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
