import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLedger } from '../hooks/useLedger';
import { BudgetAllocations } from '../types';
import { BUDGET_LINES, formatCurrency } from '../utilities/calculations';

const EMPTY_ALLOCATIONS: BudgetAllocations = {
  ASG: 0,
  Operating: 0,
  Gifts: 0,
  'Debit Card': 0,
};

export const CreateOrganization = () => {
  const { activeOrganization, initializeBudgetAllocations } = useLedger();
  const navigate = useNavigate();

  const [allocations, setAllocations] = useState<BudgetAllocations>(EMPTY_ALLOCATIONS);
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Guard: no active org selected — send back to org picker
  useEffect(() => {
    if (!activeOrganization) {
      navigate('/organizations', { replace: true });
      return;
    }
    // Guard: budget already initialized — skip straight to dashboard
    if (activeOrganization.isBudgetLinesSet) {
      navigate('/dashboard', { replace: true });
    }
  }, [activeOrganization, navigate]);

  const setAllocation = (line: keyof BudgetAllocations, raw: string) => {
    if (!/^\d*\.?\d{0,2}$/.test(raw)) return;
    setRawInputs((prev) => ({ ...prev, [line]: raw }));
    const val = parseFloat(raw);
    setAllocations((prev) => ({ ...prev, [line]: isNaN(val) ? 0 : val }));
  };

  const handleSubmit = async () => {
    const missingLines = BUDGET_LINES.filter(
      (line) => rawInputs[line] === undefined || rawInputs[line] === '',
    );
    if (missingLines.length > 0) {
      setError(`Please enter a starting amount for: ${missingLines.join(', ')}.`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await initializeBudgetAllocations(allocations);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Failed to save budget allocations. Please try again.');
      setSubmitting(false);
    }
  };

  if (!activeOrganization) return null;

  return (
    <div className="wl-register-root">
      <div className="wl-register-card">
        <h1 className="wl-register-title">WildcatLedger</h1>
        <p className="wl-register-subtitle">
          Set starting budget amounts for <strong>{activeOrganization.name}</strong>.
        </p>
        <div className="wl-budget-allocation-form">
          {BUDGET_LINES.map((line) => (
            <div key={line} className="wl-budget-allocation-row">
              <label className="wl-budget-allocation-label" htmlFor={`budget-${line}`}>
                {line}
              </label>
              <div className="wl-budget-allocation-input-wrap">
                <span className="wl-budget-allocation-prefix">$</span>
                <input
                  id={`budget-${line}`}
                  type="text"
                  inputMode="decimal"
                  className="wl-form-input wl-budget-allocation-input"
                  value={rawInputs[line] ?? ''}
                  placeholder="0.00"
                  onChange={(e) => setAllocation(line, e.target.value)}
                />
              </div>
              <span className="wl-budget-allocation-preview">
                {formatCurrency(allocations[line])}
              </span>
            </div>
          ))}
        </div>
        {error && (
          <div className="wl-form-error" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}
        <button
          type="button"
          className="wl-btn-primary wl-register-done"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Saving…' : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
};
