import React from 'react';
import { Link } from 'react-router-dom';
import './ActionBar.css';

export default function ActionBar({
  onConfirm,
  onCancel,
  isSubmitting = false,
  isBlocked = false,
  blockedMessage = '',
  errorMessage = '',
}) {
  return (
    <div className="action-bar-container">
      {blockedMessage ? (
        <div
          className="action-bar-error-toast"
          role="alert"
          data-testid="confirm-blocked-message"
        >
          {blockedMessage}
        </div>
      ) : errorMessage ? (
        <div
          className="action-bar-error-toast"
          role="alert"
          data-testid="action-bar-error"
        >
          {errorMessage}
        </div>
      ) : null}
      <div className="action-bar" data-testid="action-bar">
        <Link
          to="/upload"
          className="action-bar-cancel"
          data-testid="cancel-reupload-btn"
          onClick={onCancel}
        >
          Cancel and reupload CV
        </Link>

        <button
          type="button"
          className={`action-bar-confirm ${isBlocked ? 'is-blocked' : ''}`}
          onClick={onConfirm}
          disabled={isSubmitting}
          aria-disabled={isBlocked ? 'true' : undefined}
          data-testid="confirm-profile-btn"
        >
          <span className="action-bar-confirm-label">
            {isSubmitting ? 'Saving...' : 'Confirm profile and view matches'}
          </span>
          <svg
            className="action-bar-arrow"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
