import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import DarkPanel from '../components/onboarding/DarkPanel';
import TagInput from '../components/onboarding/TagInput';
import ChoiceChip from '../components/onboarding/ChoiceChip';
import RangeSlider from '../components/onboarding/RangeSlider';
import { getPreferences, savePreferences } from '../api/preferences';
import './CareerPreferences.css';

const WORK_TYPES = ['Remote', 'Hybrid', 'On-site'];
const SENIORITY_LEVELS = ['Internship', 'Junior', 'Mid', 'Senior'];

export default function CareerPreferences() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Form State
  const [roles, setRoles] = useState([]);
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [salaryError, setSalaryError] = useState('');
  const [workTypes, setWorkTypes] = useState([]);
  const [seniority, setSeniority] = useState('');
  const [aiDetectedSeniority, setAiDetectedSeniority] = useState('');
  const [matchQuality, setMatchQuality] = useState(80);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const applyData = (data) => {
    if (!data) {
      setLoadError(true);
    } else {
      setRoles(data.roles || []);
      setLocation(data.location || '');
      setSalary(data.salary || '');
      setWorkTypes(data.workTypes || []);
      setSeniority(data.seniority || 'Mid');
      setAiDetectedSeniority(data.aiDetectedSeniority || 'Mid');
      setMatchQuality(data.minimumMatchQuality || 80);
    }
    setLoading(false);
  };

  const handleRetry = () => {
    setLoading(true);
    setLoadError(false);
    getPreferences()
      .then(applyData)
      .catch(() => {
        setLoadError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    getPreferences()
      .then((data) => {
        if (isMounted) {
          applyData(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddRole = (newRole) => {
    setRoles((prev) => [...prev, newRole]);
  };

  const handleRemoveRole = (roleToRemove) => {
    setRoles((prev) => prev.filter((r) => r !== roleToRemove));
  };

  const handleToggleWorkType = (type) => {
    setWorkTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSalaryChange = (val) => {
    setSalary(val);
    if (val.trim() === '') {
      setSalaryError('');
      return;
    }
    const num = Number(val);
    if (isNaN(num) || num <= 0) {
      setSalaryError('Please enter a positive number.');
    } else {
      setSalaryError('');
    }
  };

  const handleSaveAndContinue = async () => {
    if (salaryError) return;

    setIsSaving(true);
    setSaveError('');

    const payload = {
      roles,
      location,
      salary,
      workTypes,
      seniority,
      minimumMatchQuality: matchQuality,
    };

    try {
      const res = await savePreferences(payload);
      if (res && res.success !== false) {
        navigate('/profile/review');
      } else {
        setSaveError('Failed to save preferences. Please try again.');
        setIsSaving(false);
      }
    } catch {
      setSaveError('Failed to save preferences. Please try again.');
      setIsSaving(false);
    }
  };

  const darkPanelContent = (
    <div className="career-left-content">
      <div className="career-left-eyebrow">AI ANALYSIS</div>

      <h1 className="career-left-heading">
        <span>Your resume is taking</span>
        <span>shape.</span>
      </h1>

      <div className="career-status-list">
        <div className="career-status-row">
          <div className="career-status-icon lime-check" aria-hidden="true">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#17332A"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="career-status-text">Document uploaded successfully</span>
        </div>

        <div className="career-status-row">
          <div className="career-status-icon lime-check" aria-hidden="true">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#17332A"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="career-status-text">Skills and experience extracted</span>
        </div>

        <div className="career-status-row">
          <div className="career-status-icon lime-star" aria-hidden="true">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="#17332A"
            >
              <path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z" />
            </svg>
          </div>
          <span className="career-status-text">Matching with live listings…</span>
        </div>
      </div>

      <div className="career-progress-bar-wrap" aria-label="Analysis progress 72%">
        <div className="career-progress-track">
          <div className="career-progress-fill" style={{ width: '72%' }} />
        </div>
      </div>

      <div className="career-info-box">
        <div className="career-info-title">✦ Smart auto-fill active</div>
        <div className="career-info-body">
          We pre-filled your goals from your CV. Review and<br />
          fine-tune them on the right.
        </div>
      </div>
    </div>
  );

  const whitePanelContent = (
    <div className="career-right-content">
      <div className="career-right-header">
        <h2 className="career-right-title">Confirm your career goals</h2>
        <p className="career-right-subtitle">AI pre-filled these based on your CV.</p>
      </div>

      {loading ? (
        <div className="career-loading-state" data-testid="career-loading">
          <div className="career-skeleton-bar" style={{ width: '40%' }} />
          <div className="career-skeleton-bar" style={{ width: '100%', height: 45 }} />
          <div className="career-skeleton-bar" style={{ width: '70%', height: 44 }} />
          <div className="career-skeleton-bar" style={{ width: '60%', height: 37 }} />
        </div>
      ) : loadError ? (
        <div className="career-error-state" data-testid="career-error">
          <p className="career-error-text">We couldn't load your preferences.</p>
          <button
            type="button"
            className="career-retry-btn"
            onClick={handleRetry}
            data-testid="retry-preferences-btn"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Desired job roles */}
          <div className="career-field-group">
            <label className="career-field-label">Desired job roles</label>
            <TagInput
              tags={roles}
              onAddTag={handleAddRole}
              onRemoveTag={handleRemoveRole}
            />
          </div>

          {/* Location & Salary */}
          <div className="career-two-col">
            <div className="career-field-group">
              <label htmlFor="pref-location" className="career-field-label">
                Preferred location
              </label>
              <input
                id="pref-location"
                type="text"
                className="career-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
                data-testid="input-preferred-location"
              />
            </div>

            <div className="career-field-group">
              <label htmlFor="pref-salary" className="career-field-label">
                Minimum salary
              </label>
              <input
                id="pref-salary"
                type="text"
                className={`career-input ${salaryError ? 'input-error' : ''}`}
                value={salary}
                onChange={(e) => handleSalaryChange(e.target.value)}
                placeholder="Flexible"
                data-testid="input-minimum-salary"
              />
              {salaryError && (
                <span className="career-salary-error" role="alert">
                  {salaryError}
                </span>
              )}
            </div>
          </div>

          {/* Work type */}
          <div className="career-field-group">
            <label className="career-field-label">Work type</label>
            <div
              className="career-chips-row"
              role="group"
              aria-label="Work type selection"
              data-testid="work-type-group"
            >
              {WORK_TYPES.map((type) => (
                <ChoiceChip
                  key={type}
                  label={type}
                  type="multi"
                  selected={workTypes.includes(type)}
                  onClick={() => handleToggleWorkType(type)}
                  testId={`chip-work-type-${type.toLowerCase()}`}
                />
              ))}
            </div>
          </div>

          {/* Seniority level */}
          <div className="career-field-group">
            <div className="career-label-row">
              <label className="career-field-label">Seniority level</label>
              {seniority === aiDetectedSeniority && (
                <span className="career-ai-tag">AI-detected</span>
              )}
            </div>
            <div
              className="career-chips-row"
              role="radiogroup"
              aria-label="Seniority level"
              data-testid="seniority-group"
            >
              {SENIORITY_LEVELS.map((lvl) => (
                <ChoiceChip
                  key={lvl}
                  label={lvl}
                  type="single"
                  role="radio"
                  selected={seniority === lvl}
                  onClick={() => setSeniority(lvl)}
                  testId={`chip-seniority-${lvl.toLowerCase()}`}
                />
              ))}
            </div>
          </div>

          {/* Minimum match quality */}
          <div className="career-field-group career-slider-group">
            <div className="career-label-row">
              <label htmlFor="match-quality-slider" className="career-field-label">
                Minimum match quality
              </label>
              <span className="career-match-percentage">{matchQuality}%</span>
            </div>
            <RangeSlider
              id="match-quality-slider"
              value={matchQuality}
              min={30}
              max={100}
              onChange={setMatchQuality}
            />
          </div>

          {/* Save Error if any */}
          {saveError && (
            <div className="career-save-error" role="alert" data-testid="save-error">
              {saveError}
            </div>
          )}

          {/* Divider */}
          <div className="career-divider" aria-hidden="true" />

          {/* Footer row */}
          <div className="career-footer-row">
            <Link to="/upload" className="career-back-btn" data-testid="back-to-upload-btn">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
              <span>Back</span>
            </Link>

            <button
              type="button"
              className="career-save-btn"
              disabled={isSaving}
              onClick={handleSaveAndContinue}
              data-testid="save-and-continue-btn"
            >
              <span>{isSaving ? 'Saving...' : 'Save and continue'}</span>
              <span className="career-btn-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <OnboardingLayout
      step={2}
      stepTitle="Career preferences"
      pillWidth={196}
      rightInset={86}
      whitePanelHeight={672}
      darkPanel={<DarkPanel height={639}>{darkPanelContent}</DarkPanel>}
      whitePanel={whitePanelContent}
      testId="onboarding-step-2"
    />
  );
}
