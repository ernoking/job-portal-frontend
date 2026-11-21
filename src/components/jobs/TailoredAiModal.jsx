import React, { useState } from 'react';
import './TailoredAiModal.css';

export default function TailoredAiModal({
  job,
  isOpen,
  onClose,
  onBackToPathways,
  onSubmitSuccess,
}) {
  const [highlights, setHighlights] = useState([
    'Led end-to-end design systems architecture and token integration.',
    'Delivered user-centered workflows increasing core task efficiency by 34%.',
    'Conducted qualitative discovery interviews and usability benchmarking with key stakeholders.',
  ]);
  const [coverLetter, setCoverLetter] = useState(
    `Dear Hiring Team at ${job?.company || 'the team'},\n\nI am excited to apply for the ${job?.title || 'open role'} position. Having reviewed your team's requirements, my background aligns closely with the technical skills and design values you are looking for.\n\nThroughout my career, I have focused on delivering clean, intuitive products that solve genuine user problems. I look forward to contributing to ${job?.company || 'your organization'}.\n\nBest regards,\nJampaniz Abuchir`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !job) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 850));
      onSubmitSuccess({
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        method: 'Tailored AI apply',
        date: new Date().toISOString(),
      });
    } catch (err) {
      setError(err?.message || 'Failed to submit tailored application. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleHighlightChange = (index, val) => {
    const next = [...highlights];
    next[index] = val;
    setHighlights(next);
  };

  return (
    <div className="tailored-ai-overlay" role="dialog" aria-modal="true" aria-labelledby="tailored-ai-title">
      <div className="tailored-ai-backdrop" onClick={onClose} />
      <div className="tailored-ai-dialog" data-node-id="208:377">
        <div className="tailored-ai-header">
          <div>
            <button
              type="button"
              className="tailored-ai-back-btn"
              onClick={onBackToPathways}
            >
              ← Choose different method
            </button>
            <div className="tailored-ai-title-row">
              <h2 id="tailored-ai-title" className="tailored-ai-title">
                Tailored AI application
              </h2>
              <span className="tailored-ai-badge">AI Optimized</span>
            </div>
            <p className="tailored-ai-subtitle">
              Customized for <span className="tailored-ai-job-name">{job.title}</span> at <span className="tailored-ai-company-name">{job.company}</span>
            </p>
          </div>
          <button
            type="button"
            className="tailored-ai-close-btn"
            onClick={onClose}
            aria-label="Close tailored application"
          >
            ×
          </button>
        </div>

        <div className="tailored-ai-body">
          {/* Card 1: Tailored Profile Highlights */}
          <div className="tailored-ai-card">
            <div className="tailored-ai-card-header">
              <h3 className="tailored-ai-card-title">Tailored CV highlights</h3>
              <span className="tailored-ai-card-hint">Generated to emphasize skills relevant to this role</span>
            </div>
            <div className="tailored-ai-highlights-list">
              {highlights.map((hl, idx) => (
                <div key={idx} className="tailored-ai-highlight-item">
                  <span className="tailored-ai-bullet">✦</span>
                  <input
                    type="text"
                    className="tailored-ai-highlight-input"
                    value={hl}
                    onChange={(e) => handleHighlightChange(idx, e.target.value)}
                    aria-label={`Highlight ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Generated Cover Letter */}
          <div className="tailored-ai-card">
            <div className="tailored-ai-card-header">
              <h3 className="tailored-ai-card-title">Role-specific cover letter</h3>
              <span className="tailored-ai-card-hint">Editable letter tailored to the job description</span>
            </div>
            <textarea
              className="tailored-ai-cover-letter-textarea"
              rows={7}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              aria-label="Role-specific cover letter"
            />
          </div>
        </div>

        {error && <p className="tailored-ai-error">{error}</p>}

        <div className="tailored-ai-footer">
          <button
            type="button"
            className="tailored-ai-btn-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="tailored-ai-btn-submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting tailored application...' : 'Submit tailored application →'}
          </button>
        </div>
      </div>
    </div>
  );
}
