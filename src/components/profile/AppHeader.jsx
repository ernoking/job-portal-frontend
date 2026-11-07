import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StepPill from './StepPill';
import './AppHeader.css';

export default function AppHeader() {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    // TODO(AJSP-5): clear session state when session handling is implemented with backend
    navigate('/login');
  };

  return (
    <header className="app-header" data-testid="app-header">
      <div className="app-header-inner">
        <Link to="/" className="app-header-logo" aria-label="Matchwise home" data-testid="app-header-logo">
          <div className="app-logo-tile">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="app-logo-star"
              aria-hidden="true"
            >
              <path
                d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z"
                fill="#17332A"
              />
            </svg>
          </div>
          <span className="app-logo-wordmark">
            <span className="app-logo-match">Match</span>
            <span className="app-logo-wise">wise</span>
          </span>
        </Link>

        <div className="app-header-right">
          <StepPill step={3} total={3} title="Profile review" />
          <button
            type="button"
            className="app-header-logout"
            onClick={handleLogout}
            data-testid="header-logout-btn"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
