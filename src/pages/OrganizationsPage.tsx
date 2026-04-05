import { useNavigate } from 'react-router-dom';

import { useLedger } from '../hooks/useLedger';

export const OrganizationsPage = () => {
  const { organizations, setActiveOrganizationId } = useLedger();
  const navigate = useNavigate();

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
          {organizations.map((org) => (
            <button
              key={org.id}
              type="button"
              className="wl-org-card"
              onClick={() => handleSelectOrg(org.id)}
            >
              <span className="wl-org-card-name">{org.name}</span>
            </button>
          ))}
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
