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

export const SetBudgetPage = () => {
  const { addOrganization } = useLedger();
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState('');
  const [allocations, setAllocations] = useState<BudgetAllocations>(EMPTY_ALLOCATIONS);

  const setAllocation = (line: keyof BudgetAllocations, val: number) => {
    setAllocations((prev) => ({ ...prev, [line]: val }));
  };

  const handleSubmit = () => {
    addOrganization(orgName.trim() || 'My Organization', allocations);
    navigate('/');
  };

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
                value={orgName}
                placeholder="Enter organization name"
                onChange={(e) => setOrgName(e.target.value)}
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
                  value={allocations[line] === 0 ? '' : allocations[line]}
                  placeholder="0.00"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setAllocation(line, isNaN(val) ? 0 : Math.max(0, val));
                  }}
                />
              </div>
              <span className="wl-budget-allocation-preview">
                {formatCurrency(allocations[line])}
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="wl-btn-primary wl-register-done"
          onClick={handleSubmit}
        >
          Create Organization
        </button>
      </div>
    </div>
  );
};
