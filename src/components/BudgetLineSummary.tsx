import { useLedger } from '../hooks/useLedger';
import { BudgetLine } from '../types';
import { BudgetLineCard } from './BudgetLineCard';

export const BudgetLineSummary = () => {
  const { budgetLineSummaries, selectedBudgetLine, setSelectedBudgetLine } = useLedger();

  const handleCardClick = (line: BudgetLine) => {
    setSelectedBudgetLine(selectedBudgetLine === line ? null : line);
  };

  return (
    <section aria-label="Budget lines">
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
    </section>
  );
};
