import React from 'react';
import { useNavigate } from 'react-router-dom';
import StepPill from './StepPill';
import BrandLogo from '../Logo';
import { useAuth } from '../../auth';
import './AppHeader.css';

export default function AppHeader({
  step = 3,
  total = 3,
  stepTitle = 'Profile review',
  pillWidth,
  rightInset,
}) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async (e) => {
    e.preventDefault();
    await signOut();
    navigate('/login');
  };

  const headerStyle = rightInset
    ? { '--header-right-inset': `${rightInset}px` }
    : undefined;

  return (
    <header className="app-header" style={headerStyle} data-testid="app-header">
      <div className="app-header-inner">
        <BrandLogo to="/" className="app-header-logo" data-testid="app-header-logo" />

        <div className="app-header-right">
          <StepPill
            step={step}
            total={total}
            title={stepTitle}
            width={pillWidth}
          />
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
