import { useEffect, useRef, useState } from 'react';

import { useLedger } from '../hooks/useLedger';
import { Transaction } from '../types';
import { formatCurrency } from '../utilities/calculations';
import { downloadReceiptsZip } from '../utilities/downloadReceiptsZip';

// Northwestern Policy Exemption Request Form
const EXEMPTION_FORM_URL =
  'https://www.northwestern.edu/financial-operations/policies-procedures/forms/policy_exception.pdf';

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

type Step = 'review' | 'reload';

export const ReconciliationModal = ({ isOpen, onClose }: ReconciliationModalProps) => {
  const {
    activeOrganization,
    reconcileTransactions,
    uploadExemptionForm,
    reloadRequests,
    requestReload,
  } = useLedger();

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

  const [step, setStep] = useState<Step>('review');
  const [reconSummary, setReconSummary] = useState<{
    transactionCount: number;
    totalAmount: number;
    exemptionCount: number;
  } | null>(null);
  const [reloadAmountStr, setReloadAmountStr] = useState('');
  const [reloadSubmitting, setReloadSubmitting] = useState(false);

  // A transaction is "covered" if it has a receipt or an attached exemption form
  const isCovered = (t: Transaction) => !!(t.receiptFileUrl || t.exemptionFormUrl);

  // Compute suggested reload amount (average of last 3 reload requests)
  const suggestedReloadAmount =
    reloadRequests.length > 0
      ? Math.round(
          (reloadRequests.slice(0, 3).reduce((sum, r) => sum + r.amount, 0) /
            Math.min(reloadRequests.length, 3)) *
            100,
        ) / 100
      : null;

  // Reset selection whenever modal opens.
  // Only pre-select covered transactions when there are no uncovered ones;
  // if any transaction is missing a receipt, start with nothing selected.
  const coveredIds = unreconciledTxns
    .filter(isCovered)
    .map((t) => t.id)
    .join(',');
  const uncoveredCount = unreconciledTxns.filter((t) => !isCovered(t)).length;
  useEffect(() => {
    if (isOpen) {
      setSelected(
        uncoveredCount === 0 && coveredIds ? new Set(coveredIds.split(',')) : new Set(),
      );
      setError(null);
      setUploading({});
      setUploadError({});
      setStep('review');
      setReconSummary(null);
      setReloadAmountStr('');
    }
  }, [isOpen, coveredIds, uncoveredCount]);

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

  // All uncovered transactions in the list (blocks reconciliation entirely)
  const uncoveredAll = unreconciledTxns.filter((t) => !isCovered(t));

  // If ANY unreconciled transaction is missing a receipt/exemption form,
  // hide ALL checkboxes — nothing can be selected until every transaction is covered
  const hideCheckboxes = uncoveredAll.length > 0;

  const coveredCount = unreconciledTxns.filter(isCovered).length;
  const displayCount = hideCheckboxes ? coveredCount : selected.size;

  const canConfirm = !hideCheckboxes && selected.size > 0;

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
    if (uncoveredAll.length > 0) {
      setError(
        `${uncoveredAll.length} transaction(s) are missing a receipt or exemption form.`,
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const reconciledTxns = unreconciledTxns.filter((t) => selected.has(t.id));
      const totalAmount = reconciledTxns
        .filter((t) => t.direction === 'Outflow')
        .reduce((sum, t) => sum + t.amount, 0);
      const exemptionCount = reconciledTxns.filter((t) => t.exemptionFormUrl).length;

      await reconcileTransactions([...selected]);

      const summary = { transactionCount: selected.size, totalAmount, exemptionCount };
      setReconSummary(summary);
      setReloadAmountStr((suggestedReloadAmount ?? totalAmount).toFixed(2));
      setStep('reload');
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

  const handleSubmitReload = async () => {
    if (!reconSummary) return;
    const amount = parseFloat(reloadAmountStr);
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid reload amount.');
      return;
    }
    setReloadSubmitting(true);
    setError(null);
    try {
      await requestReload(
        amount,
        reconSummary.totalAmount,
        reconSummary.transactionCount,
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit reload request.');
    } finally {
      setReloadSubmitting(false);
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
          {step === 'review' && (
            <>
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
                  {!hideCheckboxes && (
                    <div className="wl-recon-select-all">
                      <label className="wl-recon-check-label">
                        <input
                          type="checkbox"
                          checked={
                            unreconciledTxns.filter(isCovered).length > 0 &&
                            selected.size === unreconciledTxns.filter(isCovered).length
                          }
                          disabled={unreconciledTxns.filter(isCovered).length === 0}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? new Set(
                                    unreconciledTxns.filter(isCovered).map((t) => t.id),
                                  )
                                : new Set(),
                            )
                          }
                        />
                        Select all ({unreconciledTxns.length})
                      </label>
                    </div>
                  )}

                  <div className="wl-recon-list">
                    {unreconciledTxns.map((t) => {
                      const txnCovered = isCovered(t);
                      const isSelected = selected.has(t.id);
                      const isMissing = !txnCovered;

                      return (
                        <div
                          key={t.id}
                          className={`wl-recon-item${isMissing ? ' wl-recon-item--warning' : ''}`}
                        >
                          {/* Main row — no checkbox when any transaction is uncovered */}
                          {hideCheckboxes ? (
                            <div
                              className={`wl-recon-row${isMissing ? ' wl-recon-row--disabled' : ''}`}
                            >
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
                                  title={
                                    t.noReceiptAcknowledged
                                      ? 'Submitted without receipt — attach completed PERF to reconcile'
                                      : 'Missing receipt — attach receipt or completed PERF to reconcile'
                                  }
                                >
                                  ⚠
                                </span>
                              )}
                              <span className="wl-recon-row-amount">
                                {t.direction === 'Outflow' ? '−' : '+'}
                                {formatCurrency(t.amount)}
                              </span>
                            </div>
                          ) : (
                            <label
                              className={`wl-recon-row${isMissing ? ' wl-recon-row--disabled' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isMissing}
                                onChange={() => !isMissing && toggle(t.id)}
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
                                  title={
                                    t.noReceiptAcknowledged
                                      ? 'Submitted without receipt — attach completed PERF to reconcile'
                                      : 'Missing receipt — attach receipt or completed PERF to reconcile'
                                  }
                                >
                                  ⚠
                                </span>
                              )}
                              <span className="wl-recon-row-amount">
                                {t.direction === 'Outflow' ? '−' : '+'}
                                {formatCurrency(t.amount)}
                              </span>
                            </label>
                          )}

                          {/* Missing receipt sub-panel */}
                          {isMissing && (
                            <div className="wl-recon-missing">
                              <p className="wl-recon-missing-msg">
                                {t.noReceiptAcknowledged
                                  ? 'Submitted without receipt. '
                                  : 'No receipt on file. '}
                                <a
                                  href={EXEMPTION_FORM_URL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="wl-recon-exemption-link"
                                >
                                  {t.noReceiptAcknowledged
                                    ? 'Attach completed Policy Exemption Request Form ↗'
                                    : 'Submit Policy Exemption Request Form ↗'}
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

                  {uncoveredAll.length > 0 && (
                    <div className="wl-recon-block-warning">
                      ⚠ {uncoveredAll.length} transaction
                      {uncoveredAll.length !== 1 ? 's' : ''} cannot be reconciled until{' '}
                      {uncoveredAll.length === 1 ? 'it has' : 'they have'} a receipt or
                      attached exemption form.
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
                      disabled={submitting || !canConfirm || hideCheckboxes}
                      title={
                        hideCheckboxes
                          ? 'Resolve all missing receipts before reconciling'
                          : undefined
                      }
                    >
                      {submitting
                        ? 'Reconciling…'
                        : `Confirm & Reconcile (${displayCount})`}
                    </button>
                    {txnsWithReceipts.length > 0 && (
                      <button
                        type="button"
                        className="wl-btn-download-zip"
                        onClick={handleDownloadZip}
                        disabled={zipping || hideCheckboxes}
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
            </>
          )}

          {step === 'reload' && reconSummary && (
            <>
              <div className="wl-recon-success">
                <span className="wl-recon-success-icon">✓</span>
                <p className="wl-recon-success-title">Reconciliation complete!</p>
                <div className="wl-recon-success-stats">
                  <div className="wl-recon-success-stat">
                    <span className="wl-recon-success-stat-value">
                      {reconSummary.transactionCount}
                    </span>
                    <span className="wl-recon-success-stat-label">
                      transaction{reconSummary.transactionCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="wl-recon-success-stat">
                    <span className="wl-recon-success-stat-value">
                      {formatCurrency(reconSummary.totalAmount)}
                    </span>
                    <span className="wl-recon-success-stat-label">total spend</span>
                  </div>
                  {reconSummary.exemptionCount > 0 && (
                    <div className="wl-recon-success-stat">
                      <span className="wl-recon-success-stat-value">
                        {reconSummary.exemptionCount}
                      </span>
                      <span className="wl-recon-success-stat-label">
                        exemption{reconSummary.exemptionCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="wl-recon-reload">
                <h3 className="wl-recon-reload-title">Request a Reload</h3>
                <p className="wl-recon-reload-subtitle">
                  Request funds to replenish the debit card.
                  {suggestedReloadAmount !== null &&
                    ` Amount is suggested based on the average of the last ${Math.min(reloadRequests.length, 3)} reload request${Math.min(reloadRequests.length, 3) !== 1 ? 's' : ''}.`}
                </p>
                <div className="wl-recon-reload-input-row">
                  <span className="wl-recon-reload-dollar">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="wl-form-input wl-recon-reload-input"
                    value={reloadAmountStr}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d.]/g, '');
                      setReloadAmountStr(raw);
                      setError(null);
                    }}
                    placeholder="0.00"
                  />
                </div>
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
                  onClick={handleSubmitReload}
                  disabled={reloadSubmitting}
                >
                  {reloadSubmitting ? 'Submitting…' : 'Submit Reload Request'}
                </button>
                <button
                  type="button"
                  className="wl-btn-cancel"
                  onClick={onClose}
                  disabled={reloadSubmitting}
                >
                  Skip
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
