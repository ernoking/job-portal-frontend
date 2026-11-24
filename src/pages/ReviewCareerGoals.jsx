import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from '../components/profile/AppHeader';
import ActionBar from '../components/profile/ActionBar';
import { savePreferences } from '../api/preferences';
import { getReviewProfile, confirmProfile } from '../api/profile';
import { clearDraft } from '../onboarding/draftStore';
import './ReviewCareerGoals.css';

const WORK_TYPES = ['Remote', 'Hybrid', 'On-site'];
const SENIORITY_LEVELS = [
  { id: 'Internship', label: 'Internship' },
  { id: 'Junior', label: 'Junior' },
  { id: 'Mid', label: 'Mid-level' },
  { id: 'Senior', label: 'Senior' },
  { id: 'Lead', label: 'Lead' },
];
const CURRENCIES = ['HUF', 'EUR', 'USD'];

export default function ReviewCareerGoals() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Career goals state
  const [roles, setRoles] = useState([]);
  const [newRoleInput, setNewRoleInput] = useState('');
  const [workTypes, setWorkTypes] = useState([]);
  const [seniority, setSeniority] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [currency, setCurrency] = useState('HUF');
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  // Submission state
  const submitPending = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let isMounted = true;
    getReviewProfile()
      .then((profileData) => {
        if (!isMounted) return;
        const career = profileData?.career || {};
        setRoles((career.targetRoles || '').split(',').map(value => value.trim()).filter(Boolean));
        setWorkTypes((career.workType || '').split(',').map(value => value.trim()).filter(Boolean));
        const level = (career.seniority || '').toLowerCase();
        setSeniority(level.startsWith('mid') ? 'Mid' : level.startsWith('intern') ? 'Internship' :
          SENIORITY_LEVELS.find(item => item.id.toLowerCase() === level)?.id || '');
        setLoading(false);
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(error?.message || 'Unable to load your profile review. Please analyse your CV again.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRemoveRole = (roleToRemove) => {
    setRoles((prev) => prev.filter((r) => r !== roleToRemove));
  };

  const handleAddRoleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = newRoleInput.trim();
      if (trimmed && !roles.includes(trimmed)) {
        setRoles((prev) => [...prev, trimmed]);
        setNewRoleInput('');
      }
    }
  };

  const handleAddRoleBlur = () => {
    const trimmed = newRoleInput.trim();
    if (trimmed && !roles.includes(trimmed)) {
      setRoles((prev) => [...prev, trimmed]);
      setNewRoleInput('');
    }
  };

  const handleToggleWorkType = (type) => {
    setWorkTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSelectSeniority = (levelId) => {
    setSeniority(levelId);
  };

  const handleConfirm = async () => {
    if (loading || loadError || submitPending.current) return;
    submitPending.current = true;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Save updated preferences to draft
      await savePreferences({
        roles,
        workTypes,
        seniority,
        salary: salaryAmount ? `${salaryAmount} ${currency}` : '',
      });

      // Confirm profile
      const profile = await getReviewProfile();
      const updatedProfile = {
        ...profile,
        career: {
          ...profile?.career,
          targetRoles: roles.join(', '),
          workType: workTypes.join(', '),
          seniority: seniority,
          salaryExpectation: salaryAmount ? `${salaryAmount} ${currency}` : '',
        },
      };

      const res = await confirmProfile(updatedProfile);
      if (res && res.success !== false) {
        clearDraft();
        navigate('/matches');
      } else {
        setSubmitError('Failed to confirm goals. Please try again.');
        setIsSubmitting(false);
        submitPending.current = false;
      }
    } catch (err) {
      setSubmitError(err?.message || 'Failed to confirm goals. Please try again.');
      setIsSubmitting(false);
      submitPending.current = false;
    }
  };

  return (
    <div className="review-goals-page" data-node-id="205:104">
      <AppHeader step={3} totalSteps={3} stepTitle="Career goals review" />

      <main className="review-goals-main">
        <div className="review-goals-container">
          {/* Back Button */}
          <Link to="/profile/review" className="review-goals-back-link">
            ← Go back to previous step
          </Link>

          {/* Heading Block */}
          <div className="review-goals-heading-block" data-node-id="205:121">
            <div className="review-goals-badge" aria-hidden="true" data-node-id="205:122">
              ✓
            </div>
            <div className="review-goals-heading-texts">
              <h1 className="review-goals-title" data-node-id="205:126">
                Review your career goals
              </h1>
              <p className="review-goals-subtitle" data-node-id="205:128">
                Last step: check the goals we pre-filled from your CV and preferences, then confirm to see your matches.
              </p>
            </div>
          </div>

          {/* Goals Card */}
          <section className="review-goals-card" data-node-id="205:129">
            <h2 className="review-goals-card-title" data-node-id="205:160">
              Career goals &amp; preferences
            </h2>

            {loading ? (
              <div className="review-goals-loading">Loading preferences...</div>
            ) : loadError ? (
              <div role="alert"><p>{loadError}</p><Link to="/upload">Analyse your CV again</Link></div>
            ) : (
              <div className="review-goals-form" data-node-id="205:267">
                {/* Field 1: Desired job roles */}
                <div className="review-goals-field" data-node-id="205:268">
                  <label className="review-goals-label">Desired job roles</label>
                  <div className="review-goals-tags-container" data-node-id="205:270">
                    {roles.map((role) => (
                      <span key={role} className="review-goals-tag" data-node-id="205:271">
                        <span>{role}</span>
                        <button
                          type="button"
                          className="review-goals-tag-remove"
                          onClick={() => handleRemoveRole(role)}
                          aria-label={`Remove role ${role}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      className="review-goals-tag-input"
                      placeholder="Add another role…"
                      value={newRoleInput}
                      onChange={(e) => setNewRoleInput(e.target.value)}
                      onKeyDown={handleAddRoleKeyDown}
                      onBlur={handleAddRoleBlur}
                      aria-label="Add desired job role"
                    />
                  </div>
                </div>

                {/* Field 2: Work type */}
                <div className="review-goals-field" data-node-id="205:278">
                  <label className="review-goals-label">Work type</label>
                  <div className="review-goals-pills" role="group" aria-label="Work type selection">
                    {WORK_TYPES.map((type) => {
                      const isSelected = workTypes.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          className={`review-goals-pill ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleToggleWorkType(type)}
                          aria-pressed={isSelected}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Field 3: Seniority level */}
                <div className="review-goals-field" data-node-id="205:287">
                  <label className="review-goals-label">Seniority level</label>
                  <div className="review-goals-pills" role="radiogroup" aria-label="Seniority level">
                    {SENIORITY_LEVELS.map((level) => {
                      const isSelected = seniority === level.id;
                      return (
                        <button
                          key={level.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          className={`review-goals-pill ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleSelectSeniority(level.id)}
                        >
                          {level.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Field 4: Minimum salary expectation */}
                <div className="review-goals-field" data-node-id="205:300">
                  <label className="review-goals-label">Minimum salary expectation</label>
                  <div className="review-goals-salary-row" data-node-id="205:302">
                    <input
                      type="text"
                      className="review-goals-salary-input"
                      placeholder="Enter amount"
                      value={salaryAmount}
                      onChange={(e) => setSalaryAmount(e.target.value)}
                      aria-label="Minimum salary amount"
                    />
                    <div className="review-goals-currency-select">
                      <button
                        type="button"
                        className="review-goals-currency-btn"
                        onClick={() => setCurrencyDropdownOpen((prev) => !prev)}
                        aria-expanded={currencyDropdownOpen}
                        aria-haspopup="listbox"
                      >
                        <span>{currency}</span>
                        <span className="review-goals-currency-chevron">⌄</span>
                      </button>
                      {currencyDropdownOpen && (
                        <ul className="review-goals-currency-dropdown" role="listbox">
                          {CURRENCIES.map((curr) => (
                            <li
                              key={curr}
                              role="option"
                              aria-selected={curr === currency}
                              className={`review-goals-currency-option ${curr === currency ? 'is-active' : ''}`}
                              onClick={() => {
                                setCurrency(curr);
                                setCurrencyDropdownOpen(false);
                              }}
                            >
                              {curr}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <p className="review-goals-helper-text" data-node-id="205:308">
                    Gross salary per month. Leave empty if flexible.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Action Bar */}
          <div className="review-goals-action-bar-wrapper">
            <ActionBar
              onConfirm={handleConfirm}
              isBlocked={loading || Boolean(loadError)}
              onCancel={() => clearDraft()}
              confirmLabel="Confirm profile and view matches"
              isSubmitting={isSubmitting}
              errorMessage={submitError}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
