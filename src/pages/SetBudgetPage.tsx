import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import { db } from '../config/firebase';
import { useLedger } from '../hooks/useLedger';
import { BUDGET_LINES, formatCurrency } from '../utilities/calculations';

export const SetBudgetPage = () => {
  const {
    budgetAllocations,
    setBudgetAllocation,
    organizationName,
    setOrganizationName,
  } = useLedger();
  const navigate = useNavigate();

  return (
    <div className="wl-register-root">
      <div className="wl-register-card">
        <h1 className="wl-register-title">WildcatLedger</h1>
        <p className="wl-register-subtitle">
          Set up your organization&apos;s budget allocations to get started.
        </p>
        <div className="wl-budget-allocation-form">
          <div className="wl-budget-allocation-row">
            <label className="wl-budget-allocation-label" htmlFor="org-name">
              Organization Name
            </label>
            <div className="wl-budget-allocation-input-wrap">
              <input
                id="org-name"
                type="text"
                className="wl-form-input wl-budget-allocation-input"
                value={organizationName}
                placeholder="Enter organization name"
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </div>
            <span className="wl-budget-allocation-preview" />
          </div>
          {BUDGET_LINES.map((line) => (
            <div key={line} className="wl-budget-allocation-row">
              <label className="wl-budget-allocation-label" htmlFor={`budget-${line}`}>
                {line}
              </label>
              <div className="wl-budget-allocation-input-wrap">
                <span className="wl-budget-allocation-prefix">$</span>
                <input
                  id={`budget-${line}`}
                  type="number"
                  min="0"
                  step="0.01"
                  className="wl-form-input wl-budget-allocation-input"
                  value={budgetAllocations[line] === 0 ? '' : budgetAllocations[line]}
                  placeholder="0.00"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setBudgetAllocation(line, isNaN(val) ? 0 : Math.max(0, val));
                  }}
                />
              </div>
              <span className="wl-budget-allocation-preview">
                {formatCurrency(budgetAllocations[line])}
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="wl-btn-primary wl-register-done"
          onClick={async () => {
            await setDoc(doc(db, 'clubs', organizationName), {
              name: organizationName,
              ...budgetAllocations,
            });
            navigate('/dashboard');
          }}
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  );
};
