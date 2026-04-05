import { useState } from 'react';

import { useLedger } from '../hooks/useLedger';
import { BudgetAllocations, BudgetLine } from '../types';
import { BUDGET_LINES, formatCurrency } from '../utilities/calculations';
import { BudgetLineCard } from './BudgetLineCard';

export const BudgetLineSummary = () => {
  const {
    budgetLineSummaries,
    selectedBudgetLine,
    setSelectedBudgetLine,
    activeOrganization,
    updateBudgetAllocations,
  } = useLedger();

  const totalRemaining = budgetLineSummaries.reduce((sum, s) => sum + s.balance, 0);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BudgetAllocations>({
    ASG: 0,
    Operating: 0,
    Gifts: 0,
    'Debit Card': 0,
  });
  const [saving, setSaving] = useState(false);

  const handleEditOpen = () => {
    if (activeOrganization) {
      setDraft({ ...activeOrganization.budgetAllocations });
    }
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateBudgetAllocations(draft);
    setSaving(false);
    setEditing(false);
  };

  const handleCardClick = (line: BudgetLine) => {
    setSelectedBudgetLine(selectedBudgetLine === line ? null : line);
  };

  return (
    <section aria-label="Budget lines">
      <div className="wl-section-header">
        <h2 className="wl-section-title">Budget Lines</h2>
        <span
          className={`wl-total-remaining ${totalRemaining >= 0 ? 'wl-amount-positive' : 'wl-amount-negative'}`}
        >
          Total remaining: {formatCurrency(totalRemaining)}
        </span>
        {!editing && (
          <button type="button" className="wl-clear-filter" onClick={handleEditOpen}>
            ✏️ Edit Allocations
          </button>
        )}
        {selectedBudgetLine && !editing && (
          <button
            type="button"
            className="wl-clear-filter"
            onClick={() => setSelectedBudgetLine(null)}
          >
            Clear filter ×
          </button>
        )}
      </div>

      {editing ? (
        <div className="wl-allocation-edit">
          {BUDGET_LINES.map((line) => (
            <div key={line} className="wl-allocation-edit-row">
              <label className="wl-allocation-edit-label">{line}</label>
              <div className="wl-budget-allocation-input-wrap">
                <span className="wl-budget-allocation-prefix">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="wl-form-input wl-budget-allocation-input"
                  value={draft[line]}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      [line]: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <span className="wl-budget-allocation-preview">
                {formatCurrency(draft[line])}
              </span>
            </div>
          ))}
          <div className="wl-allocation-edit-actions">
            <button
              type="button"
              className="wl-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className="wl-btn-cancel"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
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
      )}
    </section>
  );
};
