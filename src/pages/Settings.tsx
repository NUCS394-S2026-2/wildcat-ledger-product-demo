import { useState } from 'react';
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

export const Settings = () => {
  const { activeOrganization, updateBudgetAllocations } = useLedger();
  const navigate = useNavigate();

  const [allocations, setAllocations] = useState<BudgetAllocations>(
    activeOrganization?.budgetAllocations ?? EMPTY_ALLOCATIONS,
  );
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setAllocation = (line: keyof BudgetAllocations, raw: string) => {
    if (!/^\d*\.?\d{0,2}$/.test(raw)) return;
    setRawInputs((prev) => ({ ...prev, [line]: raw }));
    const val = parseFloat(raw);
    setAllocations((prev) => ({ ...prev, [line]: isNaN(val) ? 0 : val }));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await updateBudgetAllocations(allocations);
      setSuccess(true);
      setRawInputs({});
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to save allocations. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all budget allocations to $0? This cannot be undone.')) {
      setRawInputs({});
      setAllocations(EMPTY_ALLOCATIONS);
    }
  };

  if (!activeOrganization) {
    navigate('/organizations', { replace: true });
    return null;
  }

  return (
    <div className="wl-app">
      <div className="wl-main" style={{ paddingBottom: 0, paddingTop: 16 }}>
        <button
          type="button"
          className="wl-btn-back"
          onClick={() => navigate('/dashboard')}
        >
          ← Back to Dashboard
        </button>
      </div>
      <main className="wl-main">
        <section>
          <h1
            className="wl-section-title"
            style={{ fontSize: '1.4rem', marginBottom: 24 }}
          >
            Settings
          </h1>

          <div className="wl-card" style={{ marginBottom: 24 }}>
            <h2 className="wl-section-title">Organization Info</h2>
            <div style={{ marginTop: 16 }}>
              <p style={{ margin: '8px 0', color: 'var(--color-text-muted)' }}>
                <strong>Name:</strong> {activeOrganization.name}
              </p>
              <p style={{ margin: '8px 0', color: 'var(--color-text-muted)' }}>
                <strong>Admins:</strong>{' '}
                {activeOrganization.admins && activeOrganization.admins.length > 0
                  ? activeOrganization.admins.join(', ')
                  : 'None set'}
              </p>
            </div>
          </div>

          <div className="wl-card">
            <h2 className="wl-section-title">Budget Allocations</h2>
            <p
              style={{
                marginTop: 12,
                marginBottom: 16,
                color: 'var(--color-text-muted)',
              }}
            >
              Adjust your club&apos;s starting budget amounts for each line.
            </p>

            <div className="wl-budget-allocation-form">
              {BUDGET_LINES.map((line) => (
                <div key={line} className="wl-budget-allocation-row">
                  <label
                    className="wl-budget-allocation-label"
                    htmlFor={`settings-budget-${line}`}
                  >
                    {line}
                  </label>
                  <div className="wl-budget-allocation-input-wrap">
                    <span className="wl-budget-allocation-prefix">$</span>
                    <input
                      id={`settings-budget-${line}`}
                      type="text"
                      inputMode="decimal"
                      className="wl-form-input wl-budget-allocation-input"
                      value={rawInputs[line] ?? allocations[line]}
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
            {success && (
              <div
                className="wl-form-success"
                style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: '#d1fae5',
                  color: '#065f46',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                }}
              >
                ✓ Allocations saved successfully
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: 12,
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1.5px solid var(--color-border)',
              }}
            >
              <button
                type="button"
                className="wl-btn-primary"
                onClick={handleSave}
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="wl-btn-cancel"
                onClick={handleReset}
                disabled={submitting}
              >
                Reset to $0
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
