import React, { useState } from 'react';
import './ApplyPathwaysModal.css';

export default function ApplyPathwaysModal({
  job,
  isOpen,
  onClose,
  onSelectPathway,
}) {
  const [selectedPathway, setSelectedPathway] = useState('tailored');

  if (!isOpen || !job) return null;

  const handleContinue = () => {
    onSelectPathway(selectedPathway, job);
  };

  return (
    <div className="pathways-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="pathways-modal-title">
      <div className="pathways-modal-backdrop" onClick={onClose} />
      <div className="pathways-modal-dialog" data-node-id="203:261">
        <div className="pathways-modal-header">
          <div>
            <h2 id="pathways-modal-title" className="pathways-modal-title">
              Choose your application method for this position:
            </h2>
            <p className="pathways-modal-job-summary">
              {job.title} · <span className="pathways-modal-company">{job.company}</span>
            </p>
          </div>
          <button
            type="button"
            className="pathways-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className="pathways-options" role="radiogroup" aria-label="Application method options">
          {/* Option 1: Standard manual apply */}
          <div
            className={`pathways-option-card ${selectedPathway === 'standard' ? 'is-selected' : ''}`}
            onClick={() => setSelectedPathway('standard')}
            role="radio"
            aria-checked={selectedPathway === 'standard'}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setSelectedPathway('standard');
              }
            }}
            data-node-id="203:267"
          >
            <div className="pathways-option-title-row">
              <span className={`pathways-radio ${selectedPathway === 'standard' ? 'is-checked' : ''}`} />
              <span className="pathways-option-name">Standard manual apply</span>
            </div>
            <p className="pathways-option-desc">
              Check your uploaded CV, baseline profile and standard form details in the application overview, then apply manually.
            </p>
          </div>

          {/* Option 2: Tailored AI apply (Recommended) */}
          <div
            className={`pathways-option-card ${selectedPathway === 'tailored' ? 'is-selected' : ''}`}
            onClick={() => setSelectedPathway('tailored')}
            role="radio"
            aria-checked={selectedPathway === 'tailored'}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setSelectedPathway('tailored');
              }
            }}
            data-node-id="203:274"
          >
            <div className="pathways-option-title-row">
              <span className={`pathways-radio ${selectedPathway === 'tailored' ? 'is-checked' : ''}`} />
              <span className="pathways-option-name">Tailored AI apply</span>
              <span className="pathways-badge-recommended">Recommended</span>
            </div>
            <p className="pathways-option-desc">
              Our AI automatically customises your CV profile highlights and drafts a role-specific cover letter tailored to this job.
            </p>
          </div>

          {/* Option 3: Set auto-apply rule (Pro) */}
          <div
            className={`pathways-option-card ${selectedPathway === 'auto' ? 'is-selected' : ''}`}
            onClick={() => setSelectedPathway('auto')}
            role="radio"
            aria-checked={selectedPathway === 'auto'}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setSelectedPathway('auto');
              }
            }}
            data-node-id="203:281"
          >
            <div className="pathways-option-title-row">
              <span className={`pathways-radio ${selectedPathway === 'auto' ? 'is-checked' : ''}`} />
              <span className="pathways-option-name">Set auto-apply rule</span>
              <span className="pathways-badge-pro">Pro</span>
            </div>
            <p className="pathways-option-desc">
              Apply automatically to high-match roles, e.g. above 90% match score. Premium plan required to edit rules.
            </p>
          </div>
        </div>

        <div className="pathways-modal-footer">
          <p className="pathways-footer-note">
            You can still review everything before submitting.
          </p>
          <button
            type="button"
            className="pathways-btn-continue"
            onClick={handleContinue}
          >
            {selectedPathway === 'standard' && 'Continue with standard apply →'}
            {selectedPathway === 'tailored' && 'Continue with tailored AI →'}
            {selectedPathway === 'auto' && 'Set auto-apply rule →'}
          </button>
        </div>
      </div>
    </div>
  );
}
