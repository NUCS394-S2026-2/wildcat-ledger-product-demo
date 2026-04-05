import { useLedger } from '../hooks/useLedger';
import { formatCurrency } from '../utilities/calculations';

export const TotalBudgetBar = () => {
  const { activeOrganization, overallSummary } = useLedger();

  if (!activeOrganization) return null;

  const totalAllocated = Object.values(activeOrganization.budgetAllocations).reduce(
    (sum, v) => sum + v,
    0,
  );
  const totalSpent = overallSummary.totalOutflow;
  const remaining = totalAllocated - totalSpent;
  const spentPct =
    totalAllocated > 0 ? Math.min((totalSpent / totalAllocated) * 100, 100) : 0;

  return (
    <div className="wl-total-budget-bar wl-card">
      <div className="wl-total-budget-header">
        <span className="wl-total-budget-title">Total Club Budget</span>
        <span
          className={`wl-total-budget-remaining ${remaining < 0 ? 'wl-amount-negative' : 'wl-amount-positive'}`}
        >
          {formatCurrency(remaining)} remaining
        </span>
      </div>
      <div className="wl-total-budget-meta">
        Total: {formatCurrency(totalAllocated)} &nbsp;·&nbsp; Spent:{' '}
        {formatCurrency(totalSpent)}
      </div>
      <div className="wl-progress-track wl-total-budget-track">
        <div
          className="wl-progress-fill wl-total-budget-fill"
          style={{ width: `${spentPct}%` }}
        />
      </div>
    </div>
  );
};
