import { useNavigate } from 'react-router-dom';

import logo from '../favicon/wildcats-logo.png';

export const TopNav = () => {
  const navigate = useNavigate();

  return (
    <nav className="wl-topnav">
      <div className="wl-topnav-left">
        <button
          type="button"
          className="wl-topnav-logo"
          onClick={() => navigate('/organizations')}
          aria-label="Go to home"
        >
          <img src={logo} alt="WildcatLedger" className="wl-topnav-logo-img" />
          <span className="wl-topnav-logo-text">WildcatLedger</span>
        </button>
        <button
          type="button"
          className="wl-topnav-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ← Back
        </button>
      </div>
    </nav>
  );
};
