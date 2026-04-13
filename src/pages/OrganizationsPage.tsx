import { useNavigate } from 'react-router-dom';

import { useLedger } from '../hooks/useLedger';
import { Organization } from '../types';

export const OrganizationsPage = () => {
  const { organizations, setActiveOrganizationId } = useLedger();
  const navigate = useNavigate();

  const handleSelectOrg = (org: Organization) => {
    setActiveOrganizationId(org.id);
    if (org.isBudgetLineSet) {
      navigate('/dashboard');
    } else {
      navigate('/budget-setup');
    }
  };

  return (
    <div className="wl-register-root">
      <div className="wl-org-select-wrapper">
        <div className="wl-onboarding-header">
          <h1 className="wl-register-title">WildcatLedger</h1>
          <p className="wl-onboarding-tagline">
            Track and manage your club&apos;s finances
          </p>
          <p className="wl-register-subtitle">Select an organization to get started</p>
        </div>
        <div className="wl-org-grid">
          {organizations.map((org) => (
            <button
              key={org.id}
              type="button"
              className="wl-org-card"
              onClick={() => handleSelectOrg(org)}
            >
              <span className="wl-org-card-name">{org.name}</span>
            </button>
          ))}
          {organizations.length === 0 && (
            <p className="wl-register-subtitle">
              No organizations found for your account.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
