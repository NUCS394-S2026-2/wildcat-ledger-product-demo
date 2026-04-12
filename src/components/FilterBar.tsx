import React from 'react';

import { useLedger } from '../hooks/useLedger';
import { BudgetLine } from '../types';

const ALL = 'all' as const;

export const FilterBar = () => {
  const {
    budgetLineSummaries,
    selectedBudgetLine,
    setSelectedBudgetLine,
    filteredTransactions,
  } = useLedger();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedBudgetLine(val === ALL ? null : (val as BudgetLine));
  };

  return (
    <div className="wl-filter-bar">
      <div className="wl-filter-bar-inner">
        <span className="wl-filter-label">Filter by budget line</span>
        <div className="wl-filter-select-wrap">
          <select
            id="budget-line-filter"
            className="wl-filter-select"
            value={selectedBudgetLine ?? ALL}
            onChange={handleChange}
            aria-label="Filter transactions by budget line"
          >
            <option value={ALL}>All transactions</option>
            {budgetLineSummaries.map((s) => (
              <option key={s.line} value={s.line}>
                {s.line}
              </option>
            ))}
          </select>
          <span className="wl-filter-select-arrow" aria-hidden="true">
            ▾
          </span>
        </div>
        <span className="wl-filter-count">
          {filteredTransactions.length}{' '}
          {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
        </span>
      </div>
    </div>
  );
};
