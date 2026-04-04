import { useLedger } from '../hooks/useLedger';

interface HeaderProps {
  onAddTransaction: () => void;
}

export const Header = ({ onAddTransaction }: HeaderProps) => {
  const { organizationName } = useLedger();

  return (
    <header className="wl-header">
      <div className="wl-header-content">
        <div>
          <h1 className="wl-header-title">{organizationName || 'WildcatLedger'}</h1>
        </div>
        <div className="wl-header-right">
          <button type="button" className="wl-btn-add" onClick={onAddTransaction}>
            + Add Transaction
          </button>
        </div>
      </div>
    </header>
  );
};
