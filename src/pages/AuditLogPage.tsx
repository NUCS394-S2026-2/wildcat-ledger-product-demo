import { useNavigate } from 'react-router-dom';

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

const actionLabel = (action: AuditEntry['action']) => {
  if (action === 'create')
    return { label: 'Created', className: 'wl-audit-badge--create' };
  if (action === 'edit') return { label: 'Edited', className: 'wl-audit-badge--edit' };
  return { label: 'Deleted', className: 'wl-audit-badge--delete' };
};

const DiffRow = ({
  field,
  before,
  after,
}: {
  field: string;
  before: unknown;
  after: unknown;
}) => {
  if (before === after) return null;
  return (
    <div className="wl-audit-diff-row">
      <span className="wl-audit-diff-field">{field}</span>
      <span className="wl-audit-diff-before">{String(before ?? '—')}</span>
      <span className="wl-audit-diff-arrow">→</span>
      <span className="wl-audit-diff-after">{String(after ?? '—')}</span>
    </div>
  );
};

export const AuditLogPage = () => {
  const { auditLog, activeOrganization } = useLedger();
  const navigate = useNavigate();

  return (
    <div className="wl-app">
      <div className="wl-main" style={{ paddingTop: 24 }}>
        <button
          type="button"
          className="wl-btn-back"
          onClick={() => navigate('/dashboard')}
        >
          ← Back to Dashboard
        </button>
        <h2 className="wl-audit-heading">Audit Log — {activeOrganization?.name ?? ''}</h2>
        {auditLog.length === 0 ? (
          <div className="wl-empty-state">
            <p>No audit entries yet. Changes to transactions will appear here.</p>
          </div>
        ) : (
          <div className="wl-audit-list">
            {auditLog.map((entry) => {
              const { label, className } = actionLabel(entry.action);
              return (
                <div key={entry.id} className="wl-audit-entry">
                  <div className="wl-audit-entry-header">
                    <span className={`wl-audit-badge ${className}`}>{label}</span>
                    <span className="wl-audit-title">{entry.transactionTitle}</span>
                    <span className="wl-audit-meta">
                      by {entry.performedBy} · {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                  {entry.action === 'edit' && entry.before && entry.after && (
                    <div className="wl-audit-diff">
                      {Object.keys(entry.after).map((key) => (
                        <DiffRow
                          key={key}
                          field={key}
                          before={(entry.before as Record<string, unknown>)[key]}
                          after={(entry.after as Record<string, unknown>)[key]}
                        />
                      ))}
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
