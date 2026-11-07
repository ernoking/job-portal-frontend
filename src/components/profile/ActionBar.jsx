import React from 'react';
import { Link } from 'react-router-dom';
import './ActionBar.css';

export default function ActionBar({ onConfirm, isSubmitting = false, errorMessage = '' }) {
  return (
    <div className="action-bar-container">
      {errorMessage && (
        <div className="action-bar-error-toast" role="alert" data-testid="action-bar-error">
          {errorMessage}
        </div>
      )}
      <div className="action-bar" data-testid="action-bar">
        <Link
          to="/upload"
          className="action-bar-cancel"
          data-testid="cancel-reupload-btn"
        >
          Cancel and reupload CV
        </Link>

        <button
          type="button"
          className="action-bar-confirm"
          onClick={onConfirm}
          disabled={isSubmitting}
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
