import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import './AppNav.css';

export default function AppNav({ activeTab }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef(null);
  const avatarButtonRef = useRef(null);

  const currentTab =
    activeTab ||
    (location.pathname.startsWith('/applications') ? 'tracker' : 'jobs');

  // Compute user initials: firstName[0] + lastName[0] uppercase, fallback 'AM'
  const initials = (() => {
    if (user?.firstName && user?.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'AM';
  })();

  const fullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || 'User Profile';

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    if (!popoverOpen) return;

    function handleClickOutside(e) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        avatarButtonRef.current &&
        !avatarButtonRef.current.contains(e.target)
      ) {
        setPopoverOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setPopoverOpen(false);
        avatarButtonRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [popoverOpen]);

  const handleLogout = async () => {
    setPopoverOpen(false);
    await signOut();
    navigate('/login');
  };

  return (
    <header className="app-nav" data-testid="app-nav">
      <div className="app-nav-inner">
        {/* Left: Brand Logo & Wordmark */}
        <Link to="/matches" className="app-nav-brand" aria-label="Matchwise home">
          <div className="app-nav-logo-tile" aria-hidden="true">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="app-nav-sparkle"
            >
              <path
                d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z"
                fill="var(--lime)"
              />
            </svg>
          </div>
          <span className="app-nav-wordmark">
            <span className="app-nav-match">Match</span>
            <span className="app-nav-wise">wise</span>
          </span>
        </Link>

        {/* Center: Tabs */}
        <nav className="app-nav-tabs" aria-label="Primary navigation">
          <Link
            to="/matches"
            className={`app-nav-tab ${currentTab === 'jobs' ? 'is-active is-jobs' : ''}`}
            aria-current={currentTab === 'jobs' ? 'page' : undefined}
          >
            Jobs feed
            {currentTab === 'jobs' && <span className="app-nav-indicator indicator-jobs" />}
          </Link>
          <Link
            to="/applications"
            className={`app-nav-tab ${currentTab === 'tracker' ? 'is-active is-tracker' : ''}`}
            aria-current={currentTab === 'tracker' ? 'page' : undefined}
          >
            Application tracker
            {currentTab === 'tracker' && (
              <span className="app-nav-indicator indicator-tracker" />
            )}
          </Link>
        </nav>

        {/* Right: User Avatar & Popover */}
        <div className="app-nav-user-container">
          <button
            ref={avatarButtonRef}
            type="button"
            className="app-nav-avatar"
            onClick={() => setPopoverOpen((prev) => !prev)}
            aria-haspopup="true"
            aria-expanded={popoverOpen}
            aria-label="User account menu"
            data-testid="app-nav-avatar"
          >
            {initials}
          </button>

          {popoverOpen && (
            <div
              ref={popoverRef}
              className="app-nav-popover"
              role="dialog"
              aria-label="User details"
              data-testid="app-nav-popover"
            >
              <div className="app-nav-popover-info">
                <p className="app-nav-popover-name">{fullName}</p>
                {user?.email && (
                  <p className="app-nav-popover-email">{user.email}</p>
                )}
              </div>
              <div className="app-nav-popover-divider" />
              <button
                type="button"
                className="app-nav-popover-logout"
                onClick={handleLogout}
                data-testid="nav-logout-btn"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
