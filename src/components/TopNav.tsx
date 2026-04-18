import { useNavigate } from 'react-router-dom';

import logo from '../favicon/wildcats-logo.png';

export const TopNav = () => {
  const navigate = useNavigate();

  return (
    <nav className="wl-topnav">
      <button
        type="button"
        className="wl-topnav-logo"
        onClick={() => navigate('/organizations')}
        aria-label="Go to home"
      >
        <img src={logo} alt="WildcatLedger" className="wl-topnav-logo-img" />
        <span className="wl-topnav-logo-text">WildcatLedger</span>
      </button>
    </nav>
  );
};
