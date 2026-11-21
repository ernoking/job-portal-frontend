import React, { useState } from 'react';
import './AutoApplyModal.css';

export default function AutoApplyModal({
  job: _job,
  isOpen,
  onClose,
  onBackToPathways,
  onSaveRules,
}) {
  const [minMatch, setMinMatch] = useState(90);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [excludedCompanies, setExcludedCompanies] = useState(['Current Employer Inc']);
  const [newCompanyInput, setNewCompanyInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleAddCompany = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = newCompanyInput.trim();
      if (val && !excludedCompanies.includes(val)) {
        setExcludedCompanies((prev) => [...prev, val]);
        setNewCompanyInput('');
      }
    }
  };

  const handleRemoveCompany = (c) => {
    setExcludedCompanies((prev) => prev.filter((item) => item !== c));
  };

  const handleSave = () => {
    setIsSaved(true);
    onSaveRules?.({
      minMatch,
      dailyLimit,
      excludedCompanies,
    });
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="auto-apply-overlay" role="dialog" aria-modal="true" aria-labelledby="auto-apply-title">
      <div className="auto-apply-backdrop" onClick={onClose} />
      <div className="auto-apply-dialog" data-node-id="209:314">
        <div className="auto-apply-header">
          <div>
            {onBackToPathways && (
              <button
                type="button"
                className="auto-apply-back-btn"
                onClick={onBackToPathways}
              >
                ← Choose different method
              </button>
            )}
            <div className="auto-apply-title-row">
              <h2 id="auto-apply-title" className="auto-apply-title">
                Auto-apply rules &amp; automation
              </h2>
              <span className="auto-apply-pro-badge">PRO</span>
            </div>
            <p className="auto-apply-subtitle">
              Configure automatic application submission for high-matching roles matching your criteria.
            </p>
          </div>
          <button
            type="button"
            className="auto-apply-close-btn"
            onClick={onClose}
            aria-label="Close auto-apply rules"
          >
            ×
          </button>
        </div>

        <div className="auto-apply-body">
          {/* Rule 1: Match Score Threshold */}
          <div className="auto-apply-card">
            <h3 className="auto-apply-card-title">Minimum match threshold</h3>
            <p className="auto-apply-card-desc">
              Only send applications automatically when the AI match score meets or exceeds:
            </p>
            <div className="auto-apply-pills-row">
              {[80, 85, 90, 95].map((score) => (
                <button
                  key={score}
                  type="button"
                  className={`auto-apply-pill ${minMatch === score ? 'is-selected' : ''}`}
                  onClick={() => setMinMatch(score)}
                >
                  {score}% {score === 90 ? '(Recommended)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Rule 2: Daily Application Cap */}
          <div className="auto-apply-card">
            <h3 className="auto-apply-card-title">Daily application limit</h3>
            <p className="auto-apply-card-desc">
              Paces applications to give you time to manage responses and interviews:
            </p>
            <div className="auto-apply-pills-row">
              {[3, 5, 10, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`auto-apply-pill ${dailyLimit === num ? 'is-selected' : ''}`}
                  onClick={() => setDailyLimit(num)}
                >
                  {num} applications / day
                </button>
              ))}
            </div>
          </div>

          {/* Rule 3: Excluded Companies */}
          <div className="auto-apply-card">
            <h3 className="auto-apply-card-title">Excluded companies &amp; domains</h3>
            <p className="auto-apply-card-desc">
              Never automatically apply to jobs from these employers:
            </p>
            <div className="auto-apply-tags-container">
              {excludedCompanies.map((c) => (
                <span key={c} className="auto-apply-tag">
                  <span>{c}</span>
                  <button
                    type="button"
                    className="auto-apply-tag-remove"
                    onClick={() => handleRemoveCompany(c)}
                    aria-label={`Remove ${c}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="auto-apply-tag-input"
                placeholder="Add company name…"
                value={newCompanyInput}
                onChange={(e) => setNewCompanyInput(e.target.value)}
                onKeyDown={handleAddCompany}
              />
            </div>
          </div>
        </div>

        <div className="auto-apply-footer">
          <button
            type="button"
            className="auto-apply-btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="auto-apply-btn-save"
            onClick={handleSave}
          >
            {isSaved ? '✓ Rules Saved!' : 'Save & enable auto-apply →'}
          </button>
        </div>
      </div>
    </div>
  );
}
