interface HeaderProps {
  onAddTransaction: () => void;
}

export const Header = ({ onAddTransaction }: HeaderProps) => (
  <header className="wl-header">
    <div className="wl-header-content">
      <div>
        <h1 className="wl-header-title">WildcatLedger</h1>
        <p className="wl-header-subtitle">
          Budget tracking for Northwestern student organizations
        </p>
      </div>
      <div className="wl-header-right">
        <span className="wl-header-badge">ColorStack NU</span>
        <button type="button" className="wl-btn-add" onClick={onAddTransaction}>
          + Add Transaction
        </button>
      </div>
    </div>
  </header>
);
