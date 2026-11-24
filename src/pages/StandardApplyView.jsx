import { handoffToEmployer } from '../utils/employerHandoff.js';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AppNav from '../components/nav/AppNav';
import { getMatchDetail } from '../api/jobs';
import { MOCK_JOBS } from '../mocks/jobs';
import { getProfile } from '../api/profile';
import { applyToJob } from '../api/applications';
import { useAuth } from '../auth';
import './StandardApplyView.css';

export default function StandardApplyView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [job, setJob] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const applyPending = useRef(false);
  const [error, setError] = useState('');
  const [isAppliedSuccess, setIsAppliedSuccess] = useState(false);
  const [externalApplyUrl, setExternalApplyUrl] = useState(null);

  // Form states matching Figma 208:104
  const [workAuth, setWorkAuth] = useState('EU citizen - no sponsorship needed');
  const [noticePeriod, setNoticePeriod] = useState('30 days');
  const [salaryExpectation, setSalaryExpectation] = useState('HUF 1.1M');
  const [earliestStartDate, setEarliestStartDate] = useState('Dec 1, 2026');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [consentConfirmed, setConsentConfirmed] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        let jobData = null;
        if (id) {
          jobData = await getMatchDetail(id);
        }
        if (!jobData) {
          jobData = MOCK_JOBS.find((j) => j.id === id) || MOCK_JOBS[0];
        }

        const profileData = await getProfile().catch(() => null);

        if (isMounted) {
          setJob(jobData);
          if (profileData) setProfile(profileData);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Unable to load application details.');
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!consentConfirmed) {
      setError('Please agree that your profile and CV are shared with the employer.');
      return;
    }

    const targetJobId = job?.id || id;
    if (!targetJobId) return;

    if (applyPending.current) return;
    applyPending.current = true;
    setIsSubmitting(true);
    setError('');

    try {
      const result = await handoffToEmployer({
        record: () => applyToJob(targetJobId, token), fallbackUrl: job?.url,
      });
      setIsAppliedSuccess(true);
      setExternalApplyUrl(result.url);
      if (!result.url) setError('Application recorded, but the employer link is unavailable.');
      else if (!result.opened) setError('Your browser blocked the new tab. Use Open Employer Website below.');
    } catch (err) {
      if (err?.data?.error?.code === 'ALREADY_APPLIED') {
        setError('You have already applied to this job.');
      } else if (err?.data?.error?.code === 'JOB_CLOSED') {
        setError('This job is no longer open for applications.');
      } else if (err?.data?.error?.code === 'JOB_NOT_FOUND' || err?.status === 404) {
        setError('Job not found or removed.');
      } else {
        setError(err?.message || 'Unable to record your application. Please try again.');
      }
    } finally {
      applyPending.current = false;
      setIsSubmitting(false);
    }
  };



  if (isLoading) {
    return (
      <div className="standard-apply-page">
        <AppNav activeTab="jobs" />
        <main className="standard-apply-container">
          <div className="standard-apply-loading">Loading application details...</div>
        </main>
      </div>
    );
  }

  const currentJob = job || MOCK_JOBS[0];
  const personal = profile?.personal || {};
  const fitScore = currentJob.fit || 94;

  return (
    <div className="standard-apply-page">
      <AppNav activeTab="jobs" />

      <main className="standard-apply-container">
        {/* Top breadcrumb */}
        <div className="standard-apply-nav-row">
          <Link to="/matches" className="standard-apply-back-link">
            ← Back to job
          </Link>
        </div>

        {/* Title Block */}
        <header className="standard-apply-title-block">
          <h1 className="standard-apply-page-title">Application overview</h1>
          <p className="standard-apply-page-sub">
            Check that your uploaded CV, baseline profile and standard form details suit this role, then apply manually.
          </p>
        </header>

        {/* Compact Job Summary Tile (y=210) */}
        <section className="standard-apply-job-card" aria-label="Target job summary">
          <div className="standard-apply-job-left">
            <div className="standard-apply-job-logo">
              {currentJob.companyInitial || currentJob.company?.[0]?.toUpperCase() || 'N'}
            </div>
            <div className="standard-apply-job-meta">
              <h2 className="standard-apply-job-title">{currentJob.title}</h2>
              <p className="standard-apply-job-sub">
                {currentJob.company} · {currentJob.location} · {currentJob.workType || 'Hybrid'} · {currentJob.employmentType || 'Full-time'}
              </p>
            </div>
          </div>
          <div className="standard-apply-job-fit-pill">
            <span className="fit-pill-text">{fitScore}% fit</span>
          </div>
        </section>

        {/* Two-Column Grid: Form left (807px) + Ready card right (380px) */}
        <div className="standard-apply-grid">
          {/* Main Column */}
          <div className="standard-apply-main-col">
            {/* 1. Uploaded CV Card */}
            <div className="standard-apply-card">
              <div className="standard-apply-card-header">
                <h3 className="standard-apply-card-title">Uploaded CV</h3>
                <Link to="/upload" className="standard-apply-card-action">
                  Replace file
                </Link>
              </div>

              <div className="standard-apply-file-box">
                <div className="standard-apply-file-badge">PDF</div>
                <div className="standard-apply-file-info">
                  <span className="standard-apply-file-name">file_CV_2026.pdf</span>
                  <span className="standard-apply-file-meta">2.4 MB · uploaded during onboarding</span>
                </div>
                <div className="standard-apply-attached-tag">
                  ✓ Attached
                </div>
              </div>
            </div>

            {/* 2. Baseline Profile Card */}
            <div className="standard-apply-card">
              <div className="standard-apply-card-header">
                <h3 className="standard-apply-card-title">Baseline profile</h3>
                <Link to="/settings" className="standard-apply-card-action">
                  Edit profile
                </Link>
              </div>

              <div className="standard-apply-profile-inputs-grid">
                <div className="standard-apply-input-group">
                  <label className="standard-apply-input-label">Name</label>
                  <input
                    type="text"
                    readOnly
                    className="standard-apply-readonly-input"
                    value={personal.name || 'Alex Morgan'}
                  />
                </div>
                <div className="standard-apply-input-group">
                  <label className="standard-apply-input-label">Email</label>
                  <input
                    type="email"
                    readOnly
                    className="standard-apply-readonly-input"
                    value={personal.email || 'alex.morgan@email.com'}
                  />
                </div>
                <div className="standard-apply-input-group">
                  <label className="standard-apply-input-label">Phone</label>
                  <input
                    type="text"
                    readOnly
                    className="standard-apply-readonly-input"
                    value={personal.phone || '+36 30 123 4567'}
                  />
                </div>
                <div className="standard-apply-input-group">
                  <label className="standard-apply-input-label">Location</label>
                  <input
                    type="text"
                    readOnly
                    className="standard-apply-readonly-input"
                    value={personal.location || 'Budapest, Hungary'}
                  />
                </div>
              </div>

              <div className="standard-apply-profile-summary-rows">
                <div className="standard-apply-summary-row">
                  <span className="summary-row-label">Work experience</span>
                  <span className="summary-row-val">Product Designer at Acme Studio · 2019–2024</span>
                </div>
                <div className="standard-apply-summary-row">
                  <span className="summary-row-label">Education</span>
                  <span className="summary-row-val">MSc Interaction Design at MOME · 2021</span>
                </div>
                <div className="standard-apply-summary-row">
                  <span className="summary-row-label">Skills</span>
                  <span className="summary-row-val">Figma, User research, Design systems, Prototyping</span>
                </div>
              </div>
            </div>

            {/* 3. Standard Form Details Card */}
            <form onSubmit={handleSubmit} className="standard-apply-card">
              <div className="standard-apply-card-header">
                <h3 className="standard-apply-card-title">Standard form details</h3>
              </div>

              <div className="standard-apply-form-grid">
                <div className="standard-apply-input-group">
                  <label className="standard-apply-input-label">Work authorisation</label>
                  <div className="standard-apply-select-wrap">
                    <select
                      className="standard-apply-select"
                      value={workAuth}
                      onChange={(e) => setWorkAuth(e.target.value)}
                    >
                      <option value="EU citizen - no sponsorship needed">EU citizen – no sponsorship needed</option>
                      <option value="Needs sponsorship">Needs sponsorship</option>
                      <option value="Valid work permit">Valid work permit</option>
                    </select>
                  </div>
                </div>

                <div className="standard-apply-input-group">
                  <label className="standard-apply-input-label">Notice period</label>
                  <div className="standard-apply-select-wrap">
                    <select
                      className="standard-apply-select"
                      value={noticePeriod}
                      onChange={(e) => setNoticePeriod(e.target.value)}
                    >
                      <option value="Immediate">Immediate</option>
                      <option value="15 days">15 days</option>
                      <option value="30 days">30 days</option>
                      <option value="60 days">60 days</option>
                    </select>
                  </div>
                </div>

                <div className="standard-apply-input-group">
                  <label className="standard-apply-input-label">Salary expectation (gross / month)</label>
                  <input
                    type="text"
                    className="standard-apply-text-input"
                    value={salaryExpectation}
                    onChange={(e) => setSalaryExpectation(e.target.value)}
                    placeholder="e.g. HUF 1.1M"
                  />
                </div>

                <div className="standard-apply-input-group">
                  <label className="standard-apply-input-label">Earliest start date</label>
                  <div className="standard-apply-select-wrap">
                    <select
                      className="standard-apply-select"
                      value={earliestStartDate}
                      onChange={(e) => setEarliestStartDate(e.target.value)}
                    >
                      <option value="Dec 1, 2026">Dec 1, 2026</option>
                      <option value="Jan 1, 2027">Jan 1, 2027</option>
                      <option value="Immediately">Immediately</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="standard-apply-full-field">
                <label className="standard-apply-input-label">Additional information (optional)</label>
                <textarea
                  className="standard-apply-textarea"
                  rows={4}
                  placeholder="Anything the hiring team should know..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                />
              </div>

              <div className="standard-apply-consent-row">
                <label className="standard-apply-checkbox-label">
                  <input
                    type="checkbox"
                    className="standard-apply-checkbox"
                    checked={consentConfirmed}
                    onChange={(e) => setConsentConfirmed(e.target.checked)}
                  />
                  <span>I agree that my profile and CV are shared with {currentJob.company} for this application.</span>
                </label>
              </div>

              {error && <div className="standard-apply-error-msg">{error}</div>}
            </form>
          </div>

          {/* Right Sidebar: Ready to apply? Card */}
          <aside className="standard-apply-sidebar">
            <div className="standard-apply-ready-card">
              <h3 className="ready-card-title">Ready to apply?</h3>

              <div className="ready-method-row">
                <span className="ready-method-label">Method:</span>
                <span className="ready-method-val">Standard manual apply</span>
              </div>

              <ul className="ready-checklist">
                <li className="ready-checklist-item">
                  <span className="ready-check-icon">✓</span>
                  <span>CV attached</span>
                </li>
                <li className="ready-checklist-item">
                  <span className="ready-check-icon">✓</span>
                  <span>Baseline profile complete</span>
                </li>
                <li className="ready-checklist-item">
                  <span className="ready-check-icon">✓</span>
                  <span>Form details filled in</span>
                </li>
                <li className="ready-checklist-item">
                  <span className="ready-check-icon">✓</span>
                  <span>Consent confirmed</span>
                </li>
              </ul>

              {isAppliedSuccess ? (
                <div className="ready-success-box" style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: '#edfcf2',
                  border: '1px solid #73e2a3',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#087443', marginBottom: '6px' }}>
                    ✓ Application Recorded
                  </div>
                  <p style={{ fontSize: '13px', color: '#155e37', lineHeight: '1.4', margin: '0 0 12px 0' }}>
                    Your application has been logged in Matchwise. Complete any remaining employer-specific steps on their site.
                  </p>
                  {externalApplyUrl && (
                    <a
                      href={externalApplyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ready-submit-btn"
                      style={{ display: 'inline-block', textDecoration: 'none', marginBottom: '8px' }}
                    >
                      Open Employer Website ↗
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/matches')}
                    className="ready-switch-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Back to Job Feed
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="ready-submit-btn"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Recording application...' : 'Apply on employer website →'}
                  </button>
                </>
              )}

              <div className="ready-switch-box">
                <span className="ready-switch-title">Want a stronger application?</span>
                <Link
                  to={`/jobs/${currentJob.id}/tailor`}
                  className="ready-switch-link"
                >
                  Switch to Tailored AI CV and cover letter →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
