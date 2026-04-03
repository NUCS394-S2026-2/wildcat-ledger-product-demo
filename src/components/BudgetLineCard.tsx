import { BudgetLineSummaryData } from '../types';
import { formatCurrency } from '../utilities/calculations';

interface BudgetLineCardProps {
  summary: BudgetLineSummaryData;
  isActive: boolean;
  onClick: () => void;
}

export const BudgetLineCard = ({ summary, isActive, onClick }: BudgetLineCardProps) => {
  const balancePositive = summary.balance >= 0;
  return (
    <button
      type="button"
      className={`wl-budget-card${isActive ? ' wl-budget-card--active' : ''}`}
      onClick={onClick}
      aria-pressed={isActive}
    >
      <span className="wl-budget-card-line">{summary.line}</span>
      <span
        className={`wl-budget-card-balance ${balancePositive ? 'wl-amount-positive' : 'wl-amount-negative'}`}
      >
        {formatCurrency(summary.balance)}
      </span>
    </button>
  );
};
