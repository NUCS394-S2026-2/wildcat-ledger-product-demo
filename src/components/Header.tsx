import { useNavigate } from 'react-router-dom';

import { useLedger } from '../hooks/useLedger';

interface HeaderProps {
  onAddTransaction: () => void;
}

export const Header = ({ onAddTransaction }: HeaderProps) => {
  const { activeOrganization, userRole } = useLedger();
  const navigate = useNavigate();

  return (
    <header className="wl-header">
      <div className="wl-header-content">
        <div>
          <h1 className="wl-header-title">
            {activeOrganization?.name ?? 'WildcatLedger'}
          </h1>
        </div>
        <div className="wl-header-right">
          {(userRole === 'treasurer' || userRole === 'president') && (
            <button type="button" className="wl-btn-add" onClick={onAddTransaction}>
              + Add Transaction
            </button>
          )}
          <button
            type="button"
            className="wl-btn-header-icon"
            onClick={() => navigate('/audit-log')}
            aria-label="Audit Log"
            title="Audit Log"
          >
            📋
          </button>
          <button
            type="button"
            className="wl-btn-header-icon"
            onClick={() => navigate('/settings')}
            aria-label="Settings"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>
    </header>
  );
};
