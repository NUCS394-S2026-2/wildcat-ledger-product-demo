import { useNavigate } from 'react-router-dom';

import { TopNav } from '../components/TopNav';
import { useLedger } from '../hooks/useLedger';
import { AuditEntry } from '../types';

const formatTimestamp = (ts: number) =>
  new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const actionLabel = (action: AuditEntry['action'], after: AuditEntry['after']) => {
  if (action === 'create')
    return {
      label: 'Created',
      icon: '+',
      className: 'wl-audit-badge--create',
      entryClass: 'wl-audit-entry--create',
    };
  if (action === 'edit')
    return {
      label: 'Edited',
      icon: '~',
      className: 'wl-audit-badge--edit',
      entryClass: 'wl-audit-entry--edit',
    };
  if (action === 'delete')
    return {
      label: 'Deleted',
      icon: '×',
      className: 'wl-audit-badge--delete',
      entryClass: 'wl-audit-entry--delete',
    };
  if (action === 'request_edit')
    return {
      label: 'Edit Requested',
      icon: '?',
      className: 'wl-audit-badge--request',
      entryClass: 'wl-audit-entry--request',
    };
  if (action === 'request_delete')
    return {
      label: 'Delete Requested',
      icon: '?',
      className: 'wl-audit-badge--request',
      entryClass: 'wl-audit-entry--request',
    };
  if (action === 'approve')
    return {
      label: after === null ? 'Approved Delete' : 'Approved Edit',
      icon: '✓',
      className: 'wl-audit-badge--approve',
      entryClass: 'wl-audit-entry--approve',
    };
  if (action === 'reject')
    return {
      label: 'Rejected',
      icon: '✕',
      className: 'wl-audit-badge--reject',
      entryClass: 'wl-audit-entry--reject',
    };
  if (action === 'reconcile')
    return {
      label: 'Reconciled',
      icon: '✓',
      className: 'wl-audit-badge--approve',
      entryClass: 'wl-audit-entry--approve',
    };
  if (action === 'reload_request')
    return {
      label: 'Reload Requested',
      icon: '↻',
      className: 'wl-audit-badge--create',
      entryClass: 'wl-audit-entry--create',
    };
  return {
    label: 'Cancelled',
    icon: '↩',
    className: 'wl-audit-badge--cancel',
    entryClass: 'wl-audit-entry--cancel',
  };
};

const EditDiff = ({
  changedKeys,
  before,
  after,
}: {
  changedKeys: string[];
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}) => (
  <div className="wl-audit-diff">
    <div className="wl-audit-snapshot wl-audit-snapshot--before">
      <span className="wl-audit-snapshot-label">Before</span>
      <div className="wl-audit-snapshot-rows">
        {changedKeys.map((key) => (
          <div key={key} className="wl-audit-snapshot-row">
            <span className="wl-audit-diff-field">{key}</span>
            <span className="wl-audit-snapshot-value wl-audit-snapshot-value--before">
              {String(before[key] ?? '—')}
            </span>
          </div>
        ))}
      </div>
    </div>
    <div className="wl-audit-snapshot wl-audit-snapshot--after">
      <span className="wl-audit-snapshot-label">After</span>
      <div className="wl-audit-snapshot-rows">
        {changedKeys.map((key) => (
          <div key={key} className="wl-audit-snapshot-row">
            <span className="wl-audit-diff-field">{key}</span>
            <span className="wl-audit-snapshot-value wl-audit-snapshot-value--after">
              {String(after[key] ?? '—')}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const AuditLogPage = () => {
  const { auditLog, activeOrganization } = useLedger();
  const navigate = useNavigate();

  return (
    <div className="wl-app">
      <TopNav />
      <div className="wl-main" style={{ marginTop: 64, paddingTop: 24 }}>
        <button
          type="button"
          className="wl-btn-back"
          onClick={() => navigate('/dashboard')}
        >
          ← Back to Dashboard
        </button>
        <div className="wl-audit-heading-row">
          <h2 className="wl-audit-heading">Audit Log</h2>
          {activeOrganization && (
            <span className="wl-audit-org-badge">{activeOrganization.name}</span>
          )}
          {auditLog.length > 0 && (
            <span className="wl-audit-count">
              {auditLog.length} {auditLog.length === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>
        {auditLog.length === 0 ? (
          <div className="wl-audit-empty">
            <div className="wl-audit-empty-icon">☑</div>
            <p className="wl-audit-empty-title">No activity yet</p>
            <p className="wl-audit-empty-sub">
              Changes to transactions will appear here.
            </p>
          </div>
        ) : (
          <div className="wl-audit-list">
            {auditLog.map((entry) => {
              const { label, icon, className, entryClass } = actionLabel(
                entry.action,
                entry.after,
              );
              const changedKeys =
                (entry.action === 'edit' ||
                  entry.action === 'request_edit' ||
                  entry.action === 'approve') &&
                entry.before &&
                entry.after
                  ? Object.keys(entry.after).filter(
                      (k) =>
                        (entry.before as Record<string, unknown>)[k] !==
                        (entry.after as Record<string, unknown>)[k],
                    )
                  : [];
              return (
                <div key={entry.id} className={`wl-audit-entry ${entryClass}`}>
                  <div className="wl-audit-entry-header">
                    <span className={`wl-audit-badge ${className}`}>
                      <span className="wl-audit-badge-icon">{icon}</span>
                      {label}
                    </span>
                    <span className="wl-audit-title">{entry.transactionTitle}</span>
                    <div className="wl-audit-meta">
                      <span className="wl-audit-meta-user">{entry.performedBy}</span>
                      <span className="wl-audit-meta-sep">·</span>
                      <span className="wl-audit-meta-time">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                  {changedKeys.length > 0 && (
                    <EditDiff
                      changedKeys={changedKeys}
                      before={entry.before as Record<string, unknown>}
                      after={entry.after as Record<string, unknown>}
                    />
                  )}
                  {entry.action === 'reconcile' && entry.reconciliationSummary && (
                    <div className="wl-audit-recon-summary">
                      <span>
                        {entry.reconciliationSummary.transactionCount} transactions
                      </span>
                      <span className="wl-audit-recon-sep">·</span>
                      <span>
                        ${entry.reconciliationSummary.totalAmount.toFixed(2)} total
                      </span>
                      {entry.reconciliationSummary.exemptionCount > 0 && (
                        <>
                          <span className="wl-audit-recon-sep">·</span>
                          <span>
                            {entry.reconciliationSummary.exemptionCount} exemption
                            {entry.reconciliationSummary.exemptionCount !== 1 ? 's' : ''}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  {entry.action === 'reload_request' && entry.reloadAmount != null && (
                    <div className="wl-audit-recon-summary">
                      <span>Amount requested: ${entry.reloadAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
