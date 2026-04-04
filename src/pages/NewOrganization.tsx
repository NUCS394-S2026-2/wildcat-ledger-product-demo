import { useNavigate } from 'react-router-dom';

import { useLedger } from '../hooks/useLedger';

export const NewOrganization = () => {
  const { organizations, setActiveOrganizationId } = useLedger();
  const navigate = useNavigate();

  const handleSelectOrg = (id: string) => {
    setActiveOrganizationId(id);
    navigate('/dashboard');
  };

  return (
    <div className="wl-register-root">
      <div className="wl-org-select-wrapper">
        <h1 className="wl-register-title">WildcatLedger</h1>
        <p className="wl-register-subtitle">
          Select an organization or create a new one.
        </p>
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
          </button>
        </div>
      </div>
    </div>
  );
};
