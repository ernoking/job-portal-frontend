import React from 'react';
import { useNavigate } from 'react-router-dom';
import './InlineApplicationSubmitted.css';

export default function InlineApplicationSubmitted({
  job,
  onBackToFeed,
}) {
  const navigate = useNavigate();

  return (
    <div className="inline-submitted-card" data-testid="inline-application-submitted">
      <div className="inline-submitted-badge" aria-hidden="true">
        ✓
      </div>

      <h3 className="inline-submitted-title">Application submitted</h3>

      <p className="inline-submitted-desc">
        {job?.title || 'This role'} at {job?.company || 'the employer'} was moved to the Applied column of your tracker.
      </p>

      <div className="inline-submitted-actions">
        <button
          type="button"
          className="inline-submitted-btn primary"
          onClick={() => navigate('/applications')}
        >
          View in tracker →
        </button>
        <button
          type="button"
          className="inline-submitted-btn secondary"
          onClick={onBackToFeed}
        >
          Back to feed
        </button>
      </div>
    </div>
  );
}
