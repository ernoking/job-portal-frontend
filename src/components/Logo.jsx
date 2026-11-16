import React from 'react';
import { Link } from 'react-router-dom';
import './Logo.css';

export function BrandLogo({
  variant = 'light',
  size = 'normal',
  to = '/',
  className = '',
  'data-testid': testId,
}) {
  const isDark = variant === 'dark';
  const isLarge = size === 'large';
  const isCompact = size === 'compact' || size === 'small';

  const container = (
    <div
      className={`logo-container ${isDark ? 'logo-dark' : 'logo-light'} ${
        isLarge ? 'logo-large' : isCompact ? 'logo-compact' : ''
      }`.trim()}
    >
      <div className="logo-icon-wrap" aria-hidden="true">
        <div className="logo-square">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="logo-glyph"
          >
            {/* Outer ring with gap and chevron/arrow notch on the right */}
            <path
              d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 10.9 20.8 9.85 20.44 8.88"
              stroke="#17332A"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Inner 4-point sparkle star */}
            <path
              d="M12 6.5C12 9.5 9.5 12 6.5 12C9.5 12 12 14.5 12 17.5C12 14.5 14.5 12 17.5 12C14.5 12 12 9.5 12 6.5Z"
              fill="#17332A"
            />
          </svg>
        </div>
        {/* Small white dot sitting outside top-right corner */}
        <div className="logo-badge-dot" />
      </div>
      <span className="logo-text">
        <span className="logo-match">Match</span>
        <span className="logo-wise">wise</span>
      </span>
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={`logo-link ${className}`.trim()}
        aria-label="Matchwise home"
        data-testid={testId}
      >
        {container}
      </Link>
    );
  }

  return (
    <div
      className={`logo-link-static ${className}`.trim()}
      data-testid={testId}
    >
      {container}
    </div>
  );
}

export const Logo = BrandLogo;
export default BrandLogo;
