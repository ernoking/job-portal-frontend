import React, { useState, useEffect } from 'react';
import { getProfile } from '../../api/profile';
import './StandardApplyModal.css';

export default function StandardApplyModal({
  job,
  isOpen,
  onClose,
  onBackToPathways,
  onSubmitSuccess,
}) {
  const [profile, setProfile] = useState(null);
  const [noticePeriod, setNoticePeriod] = useState('1 month');
  const [workAuth, setWorkAuth] = useState('Authorized without sponsorship');
  const [recruiterNote, setRecruiterNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    getProfile()
      .then((data) => {
        if (data) setProfile(data);
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen || !job) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Simulate real API submission latency
      await new Promise((resolve) => setTimeout(resolve, 800));

      onSubmitSuccess({
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        method: 'Standard manual apply',
        date: new Date().toISOString(),
      });
    } catch (err) {
      setError(err?.message || 'Failed to submit application. Please try again.');
      setIsSubmitting(false);
    }
  };

  const personal = profile?.personal || {};
  const skillsString = Array.isArray(profile?.skills) ? profile.skills.slice(0, 5).join(', ') : 'Figma, UI/UX, Design systems';
  const experienceString = profile?.experienceEducation?.[0]
    ? `${profile.experienceEducation[0].title} · ${profile.experienceEducation[0].period}`
    : 'Product Designer at Acme Studio · 2019–2024';
  const educationString = profile?.experienceEducation?.[1]
    ? `${profile.experienceEducation[1].title} · ${profile.experienceEducation[1].period}`
    : 'MSc Interaction Design at MOME · 2021';

  return (
    <div className="standard-apply-overlay" role="dialog" aria-modal="true" aria-labelledby="standard-apply-title">
      <div className="standard-apply-backdrop" onClick={onClose} />
      <div className="standard-apply-dialog" data-node-id="208:104">
        {/* Navigation & Title */}
        <div className="standard-apply-header">
          <div>
            <button
              type="button"
              className="standard-apply-back-btn"
              onClick={onBackToPathways}
            >
              ← Choose different method
            </button>
            <h2 id="standard-apply-title" className="standard-apply-title">
              Application overview
            </h2>
            <p className="standard-apply-subtitle">
              Applying for <span className="standard-apply-job-name">{job.title}</span> at <span className="standard-apply-company-name">{job.company}</span>
            </p>
          </div>
          <button
            type="button"
            className="standard-apply-close-btn"
            onClick={onClose}
            aria-label="Close application overview"
          >
            ×
          </button>
        </div>

        <div className="standard-apply-body">
          {/* Section 1: Uploaded CV */}
          <div className="standard-apply-card" data-node-id="208:277">
            <div className="standard-apply-card-header">
              <h3 className="standard-apply-card-title">Uploaded CV</h3>
              <span className="standard-apply-card-badge">Attached to application</span>
            </div>
            <div className="standard-apply-file-row">
              <div className="standard-apply-file-icon" aria-hidden="true">
                PDF
              </div>
              <div className="standard-apply-file-meta">
                <span className="standard-apply-file-name">CV_Matchwise_2026.pdf</span>
                <span className="standard-apply-file-desc">2.4 MB · Active profile CV</span>
              </div>
              <span className="standard-apply-attached-pill">
                ✓ Attached
              </span>
            </div>
          </div>

          {/* Section 2: Baseline profile */}
          <div className="standard-apply-card" data-node-id="208:290">
            <div className="standard-apply-card-header">
              <h3 className="standard-apply-card-title">Baseline profile</h3>
              <span className="standard-apply-card-sub">Pre-filled from your account</span>
            </div>
            <div className="standard-apply-profile-grid">
              <div className="standard-apply-grid-item">
                <span className="standard-apply-grid-label">FULL NAME</span>
                <span className="standard-apply-grid-value">{personal.name || 'Jampaniz Abuchir'}</span>
              </div>
              <div className="standard-apply-grid-item">
                <span className="standard-apply-grid-label">EMAIL</span>
                <span className="standard-apply-grid-value">{personal.email || 'jampaniz.pira@mailbox.unideb.hu'}</span>
              </div>
              <div className="standard-apply-grid-item">
                <span className="standard-apply-grid-label">PHONE</span>
                <span className="standard-apply-grid-value">{personal.phone || '+36 30 123 4567'}</span>
              </div>
              <div className="standard-apply-grid-item">
                <span className="standard-apply-grid-label">LOCATION</span>
                <span className="standard-apply-grid-value">{personal.location || job.location || 'Budapest, Hungary'}</span>
              </div>
            </div>

            <div className="standard-apply-summary-list">
              <div className="standard-apply-summary-row">
                <span className="standard-apply-summary-label">Experience</span>
                <span className="standard-apply-summary-value">{experienceString}</span>
              </div>
              <div className="standard-apply-summary-row">
                <span className="standard-apply-summary-label">Education</span>
                <span className="standard-apply-summary-value">{educationString}</span>
              </div>
              <div className="standard-apply-summary-row">
                <span className="standard-apply-summary-label">Top Skills</span>
                <span className="standard-apply-summary-value">{skillsString}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Standard form details */}
          <div className="standard-apply-card" data-node-id="208:322">
            <div className="standard-apply-card-header">
              <h3 className="standard-apply-card-title">Standard form details</h3>
            </div>
            <div className="standard-apply-fields-form">
              <div className="standard-apply-field-group">
                <label className="standard-apply-field-label">Notice period / Earliest start</label>
                <div className="standard-apply-pills-row">
                  {['Immediate', '2 weeks', '1 month', '2+ months'].map((np) => (
                    <button
                      key={np}
                      type="button"
                      className={`standard-apply-pill ${noticePeriod === np ? 'is-selected' : ''}`}
                      onClick={() => setNoticePeriod(np)}
                    >
                      {np}
                    </button>
                  ))}
                </div>
              </div>

              <div className="standard-apply-field-group">
                <label className="standard-apply-field-label">Work authorization</label>
                <div className="standard-apply-pills-row">
                  {['Authorized without sponsorship', 'Requires visa sponsorship'].map((auth) => (
                    <button
                      key={auth}
                      type="button"
                      className={`standard-apply-pill ${workAuth === auth ? 'is-selected' : ''}`}
                      onClick={() => setWorkAuth(auth)}
                    >
                      {auth}
                    </button>
                  ))}
                </div>
              </div>

              <div className="standard-apply-field-group">
                <label className="standard-apply-field-label">Note to hiring team (optional)</label>
                <textarea
                  className="standard-apply-textarea"
                  rows={3}
                  placeholder="Share a brief introduction or specific reason you're excited about this role..."
                  value={recruiterNote}
                  onChange={(e) => setRecruiterNote(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {error && <p className="standard-apply-error">{error}</p>}

        {/* Footer Actions */}
        <div className="standard-apply-footer">
          <button
            type="button"
            className="standard-apply-btn-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="standard-apply-btn-submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting application...' : 'Submit application →'}
          </button>
        </div>
      </div>
    </div>
  );
}
