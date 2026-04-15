import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Header } from '../components/Header';
import { TransactionList } from '../components/TransactionList';
import { TransactionModal } from '../components/TransactionModal';
import { useLedger } from '../hooks/useLedger';
import { formatCurrency } from '../utilities/calculations';

export const DashboardOptionA = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const {
    budgetLineSummaries,
    overallSummary,
    selectedBudgetLine,
    setSelectedBudgetLine,
  } = useLedger();

  return (
    <div className="wl-app">
      <Header onAddTransaction={() => setModalOpen(true)} />
      <div className="wl-main" style={{ paddingBottom: 0, paddingTop: 16 }}>
        <button type="button" className="wl-btn-back" onClick={() => navigate('/')}>
          ← Back to Organizations
        </button>
      </div>

      <main className="wl-main">
        {/* Hero Stats Card */}
        <div className="wl-card wl-hero-card">
          <div className="wl-hero-content">
            <div className="wl-hero-stat">
              <span className="wl-hero-label">Total Remaining</span>
              <span
                className={`wl-hero-amount ${overallSummary.totalBalance >= 0 ? 'wl-amount-positive' : 'wl-amount-negative'}`}
              >
                {formatCurrency(overallSummary.totalBalance)}
              </span>
            </div>
            <div className="wl-hero-divider" />
            <div className="wl-hero-stat">
              <span className="wl-hero-label">Total Inflow</span>
              <span className="wl-hero-amount wl-amount-positive">
                +{formatCurrency(overallSummary.totalInflow)}
              </span>
            </div>
            <div className="wl-hero-divider" />
            <div className="wl-hero-stat">
              <span className="wl-hero-label">Total Outflow</span>
              <span className="wl-hero-amount wl-amount-negative">
                -{formatCurrency(overallSummary.totalOutflow)}
              </span>
            </div>
          </div>
        </div>

        {/* Budget Cards Section */}
        <section aria-label="Budget lines">
          <div className="wl-section-header">
            <h2 className="wl-section-title">Budget Lines</h2>
          </div>
          <div className="wl-budget-grid-optionA">
            {budgetLineSummaries.map((summary) => {
              const isActive = selectedBudgetLine === summary.line;
              const balancePositive = summary.balance >= 0;
              return (
                <button
                  key={summary.line}
                  type="button"
                  className={`wl-budget-card-optionA ${isActive ? 'wl-budget-card-optionA--active' : ''}`}
                  onClick={() => setSelectedBudgetLine(isActive ? null : summary.line)}
                  aria-pressed={isActive}
                >
                  <div className="wl-budget-card-optionA-header">
                    <span className="wl-budget-card-optionA-line">{summary.line}</span>
                    <span
                      className={`wl-budget-card-optionA-balance ${balancePositive ? 'wl-amount-positive' : 'wl-amount-negative'}`}
                    >
                      {formatCurrency(summary.balance)}
                    </span>
                  </div>
                  <div className="wl-budget-card-optionA-bar">
                    <div className="wl-budget-progress-bar">
                      <div
                        className="wl-budget-progress-fill"
                        style={{
                          width: `${Math.min(100, Math.abs((summary.balance / 10000) * 100))}%`,
                          backgroundColor: balancePositive
                            ? 'var(--color-positive)'
                            : 'var(--color-negative)',
                        }}
                      />
                    </div>
                  </div>
                  <div className="wl-budget-card-optionA-footer">
                    <span className="wl-budget-card-optionA-stat">
                      In: {formatCurrency(summary.inflow)}
                    </span>
                    <span className="wl-budget-card-optionA-stat">
                      Out: {formatCurrency(summary.outflow)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Filter & Transactions */}
        <section>
          <div className="wl-filter-tabs-optionA">
            <button
              type="button"
              className={`wl-filter-tab ${!selectedBudgetLine ? 'wl-filter-tab--active' : ''}`}
              onClick={() => setSelectedBudgetLine(null)}
            >
              All Transactions
            </button>
            {budgetLineSummaries.map((summary) => (
              <button
                key={summary.line}
                type="button"
                className={`wl-filter-tab ${selectedBudgetLine === summary.line ? 'wl-filter-tab--active' : ''}`}
                onClick={() => setSelectedBudgetLine(summary.line)}
              >
                {summary.line}
              </button>
            ))}
          </div>
          <TransactionList />
        </section>
      </main>

      <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
