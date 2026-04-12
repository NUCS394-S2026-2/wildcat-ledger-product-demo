import { useLedger } from '../hooks/useLedger';
import { formatCurrency } from '../utilities/calculations';

export const OverallSummary = () => {
  const { overallSummary } = useLedger();
  const { totalBalance, totalInflow, totalOutflow } = overallSummary;

  return (
    <section aria-label="Overall summary" className="wl-overall-grid">
      <div className="wl-overall-card wl-overall-card--balance">
        <span className="wl-overall-label">Total Balance</span>
        <span
          className={`wl-overall-value ${totalBalance >= 0 ? 'wl-amount-positive' : 'wl-amount-negative'}`}
        >
          {formatCurrency(totalBalance)}
        </span>
      </div>
      <div className="wl-overall-card wl-overall-card--inflow">
        <span className="wl-overall-label">Total Inflow</span>
        <span className="wl-overall-value wl-amount-positive">
          +{formatCurrency(totalInflow)}
        </span>
      </div>
      <div className="wl-overall-card wl-overall-card--outflow">
        <span className="wl-overall-label">Total Outflow</span>
        <span className="wl-overall-value wl-amount-negative">
          -{formatCurrency(totalOutflow)}
        </span>
      </div>
    </section>
  );
};
