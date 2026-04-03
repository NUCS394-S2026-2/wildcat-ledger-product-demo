import { useLedger } from '../hooks/useLedger';
import { FilterType } from '../types';

const FILTERS: FilterType[] = ['All', 'Inflow', 'Outflow', 'Flagged', 'Submitted'];

export const FilterBar = () => {
  const { activeFilter, setActiveFilter, selectedBudgetLine, filteredTransactions } =
    useLedger();

  const label = selectedBudgetLine
    ? `${selectedBudgetLine} — ${filteredTransactions.length} transactions`
    : `All transactions — ${filteredTransactions.length} entries`;

  return (
    <div className="wl-filter-bar">
      <span className="wl-filter-label">{label}</span>
      <div className="wl-filter-buttons" role="group" aria-label="Filter transactions">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`wl-filter-btn${activeFilter === filter ? ' wl-filter-btn--active' : ''}`}
            onClick={() => setActiveFilter(filter)}
            aria-pressed={activeFilter === filter}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
};
