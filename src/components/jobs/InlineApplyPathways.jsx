import React, { useState } from 'react';
import './InlineApplyPathways.css';

export default function InlineApplyPathways({
  job,
  onClose,
  onSelectPathway,
}) {
  const [selectedPathway, setSelectedPathway] = useState('tailored');
  const [autoApplyActive, setAutoApplyActive] = useState(false);
  const [minScore, setMinScore] = useState(90);
  const [ruleEnabled, setRuleEnabled] = useState(true);
  const [workTypeSelection, setWorkTypeSelection] = useState(['remote', 'hybrid']);
  const [applicationMethod, setApplicationMethod] = useState('tailored');
  const [maxAppsPerDay, setMaxAppsPerDay] = useState(3);
  const [reviewBeforeSending, setReviewBeforeSending] = useState(true);
  const [showAutoApplyConfig, setShowAutoApplyConfig] = useState(false);

  if (!job) return null;

  const handleContinue = () => {
    if (selectedPathway === 'auto') {
      if (!autoApplyActive) {
        // Toggle view between premium promo and rule
        setAutoApplyActive(true);
      } else {
        setShowAutoApplyConfig(true);
      }
      return;
    }
    onSelectPathway(selectedPathway, job);
  };

  const toggleWorkType = (wt) => {
    if (workTypeSelection.includes(wt)) {
      setWorkTypeSelection(workTypeSelection.filter((w) => w !== wt));
    } else {
      setWorkTypeSelection([...workTypeSelection, wt]);
    }
  };

  return (
    <section className="inline-pathways-card" aria-label="Choose application method">
      {/* Header */}
      <div className="inline-pathways-header">
        <h3 className="inline-pathways-title">
          Choose your application method for this position:
        </h3>
        <button
          type="button"
          className="inline-pathways-close-btn"
          onClick={onClose}
          aria-label="Close application method selector"
        >
          ×
        </button>
      </div>

      {/* 3 Option Cards */}
      <div className="inline-pathways-options-grid" role="radiogroup">
        {/* Option 1: Standard manual apply */}
        <div
          className={`inline-pathway-box ${selectedPathway === 'standard' ? 'is-selected' : ''}`}
          onClick={() => {
            setSelectedPathway('standard');
            setShowAutoApplyConfig(false);
          }}
          role="radio"
          aria-checked={selectedPathway === 'standard'}
          tabIndex={0}
        >
          <div className="inline-pathway-title-row">
            <span className={`inline-pathway-radio ${selectedPathway === 'standard' ? 'is-checked' : ''}`} />
            <span className="inline-pathway-name">Standard manual apply</span>
          </div>
          <p className="inline-pathway-desc">
            Check your uploaded CV, baseline profile and standard form details in the application overview, then apply manually.
          </p>
        </div>

        {/* Option 2: Tailored AI CV and cover letter */}
        <div
          className={`inline-pathway-box ${selectedPathway === 'tailored' ? 'is-selected' : ''}`}
          onClick={() => {
            setSelectedPathway('tailored');
            setShowAutoApplyConfig(false);
          }}
          role="radio"
          aria-checked={selectedPathway === 'tailored'}
          tabIndex={0}
        >
          <div className="inline-pathway-title-row">
            <span className={`inline-pathway-radio ${selectedPathway === 'tailored' ? 'is-checked' : ''}`} />
            <span className="inline-pathway-name">Tailored AI CV and cover letter</span>
            <div className="inline-badge-group">
              <span className="badge-pro-tiny">Pro</span>
              <span className="badge-default-tiny">Default</span>
            </div>
          </div>
          <p className="inline-pathway-desc">
            Customises your resume highlights and generates a targeted cover letter for this role. Opens a dedicated tailoring view.
          </p>
        </div>

        {/* Option 3: Set auto-apply rule */}
        <div
          className={`inline-pathway-box ${selectedPathway === 'auto' ? 'is-selected' : ''}`}
          onClick={() => setSelectedPathway('auto')}
          role="radio"
          aria-checked={selectedPathway === 'auto'}
          tabIndex={0}
        >
          <div className="inline-pathway-title-row">
            <span className={`inline-pathway-radio ${selectedPathway === 'auto' ? 'is-checked' : ''}`} />
            <span className="inline-pathway-name">Set auto-apply rule</span>
            <span className="badge-pro-tiny">Pro</span>
          </div>
          <p className="inline-pathway-desc">
            Apply automatically to high-match roles, e.g. above 90% match score. Premium plan required to edit rules.
          </p>
        </div>
      </div>

      {/* Auto-apply Premium Feature Banner (Figma Screen 5) */}
      {selectedPathway === 'auto' && !showAutoApplyConfig && (
        <div className="inline-auto-apply-banner">
          <div className="banner-left">
            <div className="banner-badge">PREMIUM</div>
            <h4 className="banner-title">Auto-apply is a Premium feature</h4>
            <ul className="banner-checklist">
              <li>✓ Apply automatically to every role above your match threshold</li>
              <li>✓ A tailored AI CV and cover letter for each application</li>
              <li>✓ A daily limit and an approval queue keep you in control</li>
            </ul>
          </div>
          <div className="banner-right">
            <button
              type="button"
              className="banner-upgrade-btn"
              onClick={() => setShowAutoApplyConfig(true)}
            >
              Upgrade to Premium →
            </button>
            <button type="button" className="banner-compare-link">
              Compare plans
            </button>
          </div>
        </div>
      )}

      {/* Auto-apply Rule Configured Panel (Figma Screen 7) */}
      {selectedPathway === 'auto' && showAutoApplyConfig && (
        <div className="inline-auto-apply-config">
          <div className="config-header">
            <div className="config-title-group">
              <h4 className="config-title">Auto-apply rule</h4>
              <span className="config-premium-active-badge">Premium active</span>
            </div>
            <div className="config-toggle-wrap">
              <span className="config-toggle-label">Rule enabled</span>
              <button
                type="button"
                className={`switch-btn ${ruleEnabled ? 'is-on' : ''}`}
                onClick={() => setRuleEnabled(!ruleEnabled)}
                role="switch"
                aria-checked={ruleEnabled}
              >
                <span className="switch-thumb" />
              </button>
            </div>
          </div>

          <div className="config-slider-row">
            <div className="slider-label-row">
              <span className="slider-label">Minimum match score</span>
              <span className="slider-val">&gt; {minScore}%</span>
            </div>
            <input
              type="range"
              min="70"
              max="95"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="config-slider"
            />
          </div>

          <div className="config-two-col-grid">
            <div className="config-col">
              <label className="config-field-label">Work type</label>
              <div className="config-pill-row">
                {['Remote', 'Hybrid', 'On-site'].map((wt) => (
                  <button
                    key={wt}
                    type="button"
                    className={`config-pill ${workTypeSelection.includes(wt.toLowerCase()) ? 'is-selected' : ''}`}
                    onClick={() => toggleWorkType(wt.toLowerCase())}
                  >
                    {wt}
                  </button>
                ))}
              </div>
            </div>

            <div className="config-col">
              <label className="config-field-label">Application method</label>
              <div className="config-pill-row">
                <button
                  type="button"
                  className={`config-pill ${applicationMethod === 'tailored' ? 'is-selected' : ''}`}
                  onClick={() => setApplicationMethod('tailored')}
                >
                  Tailored AI CV + letter
                </button>
                <button
                  type="button"
                  className={`config-pill ${applicationMethod === 'standard' ? 'is-selected' : ''}`}
                  onClick={() => setApplicationMethod('standard')}
                >
                  Standard
                </button>
              </div>
            </div>
          </div>

          <div className="config-two-col-grid" style={{ marginTop: 16 }}>
            <div className="config-col">
              <label className="config-field-label">Maximum applications per day</label>
              <div className="stepper-row">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => setMaxAppsPerDay(Math.max(1, maxAppsPerDay - 1))}
                >
                  –
                </button>
                <span className="stepper-val">{maxAppsPerDay}</span>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => setMaxAppsPerDay(maxAppsPerDay + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="config-col">
              <label className="config-field-label">Review before sending</label>
              <div className="config-switch-row">
                <span className="config-switch-desc">Queue matching roles for your approval for 24 hours before they are submitted.</span>
                <button
                  type="button"
                  className={`switch-btn ${reviewBeforeSending ? 'is-on' : ''}`}
                  onClick={() => setReviewBeforeSending(!reviewBeforeSending)}
                  role="switch"
                  aria-checked={reviewBeforeSending}
                >
                  <span className="switch-thumb" />
                </button>
              </div>
            </div>
          </div>

          <div className="config-roles-matched-notice">
            <span>✓ 2 roles in your feed match this rule right now.</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="inline-pathways-footer">
        <span className="inline-pathways-footer-note">
          You can still review everything before submitting.
        </span>

        {selectedPathway === 'auto' && !showAutoApplyConfig ? (
          <button
            type="button"
            className="inline-pathways-action-btn secondary"
            onClick={onClose}
          >
            Maybe later
          </button>
        ) : selectedPathway === 'auto' && showAutoApplyConfig ? (
          <button
            type="button"
            className="inline-pathways-action-btn"
            onClick={() => onSelectPathway('auto', job)}
          >
            Save auto-apply rule →
          </button>
        ) : (
          <button
            type="button"
            className="inline-pathways-action-btn"
            onClick={handleContinue}
          >
            {selectedPathway === 'standard' && 'Continue with standard apply →'}
            {selectedPathway === 'tailored' && 'Continue with tailored AI →'}
          </button>
        )}
      </div>
    </section>
  );
}
