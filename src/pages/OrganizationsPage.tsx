import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLedger } from '../hooks/useLedger';
import { Organization } from '../types';
import { formatCurrency } from '../utilities/calculations';

function getOrgBudgetStats(org: Organization) {
  const totalBudget = Object.values(org.budgetAllocations).reduce((sum, v) => sum + v, 0);
  const totalSpent = org.transactions
    .filter((t) => t.direction === 'Outflow')
    .reduce((sum, t) => sum + t.amount, 0);
  const remaining = totalBudget - totalSpent;
  const spentPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  return { totalBudget, totalSpent, remaining, spentPct };
}

export const OrganizationsPage = () => {
  const { organizations, setActiveOrganizationId } = useLedger();
  const navigate = useNavigate();
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);

  const handleSelectOrg = (id: string) => {
    setActiveOrganizationId(id);
    navigate('/dashboard');
  };

  return (
    <div className="wl-register-root">
      <div className="wl-org-select-wrapper">
        <div className="wl-onboarding-header">
          <h1 className="wl-register-title">WildcatLedger</h1>
          <p className="wl-onboarding-tagline">
            Track and manage your club&apos;s finances
          </p>
          <p className="wl-register-subtitle">
            Create or select an organization to get started
          </p>
        </div>
        <div className="wl-org-grid">
          {organizations.map((org) => {
            const { totalBudget, totalSpent, remaining, spentPct } =
              getOrgBudgetStats(org);
            const isExpanded = expandedOrgId === org.id;
            return (
              <div key={org.id} className="wl-org-card-wrap">
                <button
                  type="button"
                  className="wl-org-card-main"
                  onClick={() => handleSelectOrg(org.id)}
                >
                  <span className="wl-org-card-name">{org.name}</span>
                </button>
                <div className="wl-org-budget-bar">
                  <div className="wl-org-budget-summary">
                    Total: {formatCurrency(totalBudget)} | Spent:{' '}
                    {formatCurrency(totalSpent)} | Remaining: {formatCurrency(remaining)}
                  </div>
                  <div className="wl-progress-track">
                    <div
                      className="wl-progress-fill wl-org-budget-fill"
                      style={{ width: `${spentPct}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    className="wl-org-budget-toggle"
                    onClick={() => setExpandedOrgId(isExpanded ? null : org.id)}
                  >
                    {isExpanded ? '▲ Hide breakdown' : '▼ See breakdown'}
                  </button>
                  {isExpanded && (
                    <div className="wl-org-budget-breakdown">
                      {(Object.entries(org.budgetAllocations) as [string, number][]).map(
                        ([line, alloc]) => {
                          const lineSpent = org.transactions
                            .filter(
                              (t) => t.budgetLine === line && t.direction === 'Outflow',
                            )
                            .reduce((sum, t) => sum + t.amount, 0);
                          const lineRemaining = alloc - lineSpent;
                          const linePct =
                            alloc > 0 ? Math.min((lineSpent / alloc) * 100, 100) : 0;
                          return (
                            <div key={line} className="wl-org-budget-line-row">
                              <div className="wl-org-budget-line-header">
                                <span className="wl-org-budget-line-name">{line}</span>
                                <span
                                  className={`wl-org-budget-line-remaining${lineRemaining < 0 ? ' wl-amount-negative' : ''}`}
                                >
                                  {formatCurrency(lineRemaining)} left
                                </span>
                              </div>
                              <div className="wl-progress-track wl-progress-track--sm">
                                <div
                                  className="wl-progress-fill wl-org-budget-fill"
                                  style={{ width: `${linePct}%` }}
                                />
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <button
            type="button"
            className="wl-org-card wl-org-card--create"
            onClick={() => navigate('/setup')}
          >
            <span className="wl-org-card-create-icon">+</span>
            <span className="wl-org-card-name">Create Organization</span>
            <span className="wl-org-card-hint">Start tracking your budget</span>
          </button>
        </div>
      </div>
    </div>
  );
};
