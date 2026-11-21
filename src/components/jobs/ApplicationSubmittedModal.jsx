import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ApplicationSubmittedModal.css';

export default function ApplicationSubmittedModal({
  submission,
  isOpen,
  onClose,
}) {
  const navigate = useNavigate();

  if (!isOpen || !submission) return null;

  const handleGoToTracker = () => {
    onClose();
    navigate('/applications');
  };

  return (
    <div className="submitted-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="submitted-modal-title">
      <div className="submitted-modal-backdrop" onClick={onClose} />
      <div className="submitted-modal-dialog" data-node-id="209:561">
        <div className="submitted-modal-badge" aria-hidden="true">
          ✓
        </div>

        <h2 id="submitted-modal-title" className="submitted-modal-title">
          Application submitted!
        </h2>

        <p className="submitted-modal-subtitle">
          Your application for <span className="submitted-modal-job">{submission.jobTitle}</span> at <span className="submitted-modal-company">{submission.company}</span> was delivered.
        </p>

        <div className="submitted-modal-details-card">
          <div className="submitted-modal-row">
            <span className="submitted-modal-label">Method</span>
            <span className="submitted-modal-value">{submission.method || 'Standard manual apply'}</span>
          </div>
          <div className="submitted-modal-row">
            <span className="submitted-modal-label">Status</span>
            <span className="submitted-modal-pill">✓ Applied</span>
          </div>
          <div className="submitted-modal-row">
            <span className="submitted-modal-label">Date</span>
            <span className="submitted-modal-value">Today</span>
          </div>
        </div>

        <div className="submitted-modal-actions">
          <button
            type="button"
            className="submitted-modal-btn-tracker"
            onClick={handleGoToTracker}
          >
            Track in Application tracker →
          </button>
          <button
            type="button"
            className="submitted-modal-btn-close"
            onClick={onClose}
          >
            Back to jobs feed
          </button>
        </div>
      </div>
    </div>
  );
}
