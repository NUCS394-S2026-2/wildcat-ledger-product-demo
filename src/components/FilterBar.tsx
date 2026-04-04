import { useLedger } from '../hooks/useLedger';

export const FilterBar = () => {
  const { selectedBudgetLine, filteredTransactions } = useLedger();

  const label = selectedBudgetLine
    ? `${selectedBudgetLine} — ${filteredTransactions.length} transactions`
    : `All transactions — ${filteredTransactions.length} entries`;

  return (
    <div className="wl-filter-bar">
      <span className="wl-filter-label">{label}</span>
    </div>
  );
};
