import { useLedger } from '../hooks/useLedger';
import { BudgetLine } from '../types';
import { BudgetLineCard } from './BudgetLineCard';

export const BudgetLineSummary = () => {
  const {
    budgetLineSummaries,
    selectedBudgetLine,
    setSelectedBudgetLine,
    overallSummary,
  } = useLedger();
  const { flaggedCount } = overallSummary;

  const handleCardClick = (line: BudgetLine) => {
    setSelectedBudgetLine(selectedBudgetLine === line ? null : line);
  };

  return (
    <section aria-label="Budget lines and incomplete transactions">
      <div className="wl-section-header">
        <h2 className="wl-section-title">Budget Lines</h2>
        {selectedBudgetLine && (
          <button
            type="button"
            className="wl-clear-filter"
            onClick={() => setSelectedBudgetLine(null)}
          >
            Clear filter ×
          </button>
        )}
      </div>
      <div className="wl-budget-row">
        <div className="wl-budget-grid">
          {budgetLineSummaries.map((summary) => (
            <BudgetLineCard
              key={summary.line}
              summary={summary}
              isActive={selectedBudgetLine === summary.line}
              onClick={() => handleCardClick(summary.line)}
            />
          ))}
        </div>
        <div
          className={`wl-incomplete-card${flaggedCount > 0 ? ' wl-incomplete-card--alert' : ''}`}
        >
          <span className="wl-incomplete-label">Incomplete</span>
          <span className="wl-incomplete-count">{flaggedCount}</span>
          <span className="wl-incomplete-sub">transactions need attention</span>
        </div>
      </div>
    </section>
  );
};
