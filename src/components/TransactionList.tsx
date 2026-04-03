import { useLedger } from '../hooks/useLedger';
import { Transaction } from '../types';
import {
  formatCurrency,
  getMissingRequirements,
  isTransactionFlagged,
} from '../utilities/calculations';
import { StatusBadge } from './StatusBadge';

const TransactionRow = ({ t }: { t: Transaction }) => {
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
    </tr>
  );
};

export const TransactionList = () => {
  const { filteredTransactions } = useLedger();

  if (filteredTransactions.length === 0) {
    return (
      <div className="wl-card wl-empty-state">
        <p>No transactions match this filter.</p>
      </div>
    );
  }

  return (
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
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => (
              <TransactionRow key={t.id} t={t} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
