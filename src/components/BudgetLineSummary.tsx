import { useLedger } from '../hooks/useLedger';
import { BudgetLine } from '../types';
import { formatCurrency } from '../utilities/calculations';
import { BudgetLineCard } from './BudgetLineCard';

export const BudgetLineSummary = () => {
  const { budgetLineSummaries, selectedBudgetLine, setSelectedBudgetLine } = useLedger();

  const selectedSummary = selectedBudgetLine
    ? budgetLineSummaries.find((s) => s.line === selectedBudgetLine)
    : null;

  const displayTotal = selectedSummary
    ? selectedSummary.balance
    : budgetLineSummaries.reduce((sum, s) => sum + s.balance, 0);

  const totalLabel = selectedSummary
    ? `${selectedSummary.line} remaining`
    : 'Total remaining';

  const handleCardClick = (line: BudgetLine) => {
    setSelectedBudgetLine(selectedBudgetLine === line ? null : line);
  };

  return (
    <section aria-label="Budget lines">
      <div className="wl-section-header">
        <h2 className="wl-section-title">Budget Lines</h2>
        <span
          className={`wl-total-remaining ${displayTotal >= 0 ? 'wl-amount-positive' : 'wl-amount-negative'}`}
        >
          {totalLabel}: {formatCurrency(displayTotal)}
        </span>
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
