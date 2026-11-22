import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppNav from '../components/nav/AppNav';
import AiRateLimitBanner from '../components/common/AiRateLimitBanner';
import { getMatchDetail } from '../api/jobs';
import { MOCK_JOBS } from '../mocks/jobs';
import './TailoredAiView.css';

export default function TailoredAiView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tailored'); // 'tailored' | 'original'
  const [tone, setTone] = useState('professional'); // 'professional' | 'friendly' | 'concise'
  const [aiError, setAiError] = useState(null);

  const [coverLetter, setCoverLetter] = useState(
    `Dear Northstar Labs hiring team,\n\nI am writing to express my interest in this position. (AI letter generation will be available once connected to the backend).\n\nBest regards,\nAlex Morgan`
  );

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      let jobData = null;
      if (id) {
        jobData = await getMatchDetail(id).catch(() => null);
      }
      if (!jobData) {
        jobData = MOCK_JOBS.find((j) => j.id === id) || MOCK_JOBS[0];
      }

      if (isMounted) {
        setJob(jobData);
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id]);





  const currentJob = job || MOCK_JOBS[0];
  const fitScore = currentJob.fit || 94;

  if (isLoading) {
    return (
      <div className="tailored-ai-page">
        <AppNav activeTab="jobs" />
        <main className="tailored-ai-container">
          <div className="tailored-ai-loading">Loading tailoring environment...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="tailored-ai-page">
      <AppNav activeTab="jobs" />

      <main className="tailored-ai-container">
        {/* Breadcrumb */}
        <div className="tailored-nav-row">
          <Link to="/matches" className="tailored-back-link">
            ← Back to job
          </Link>
        </div>

        {/* Title */}
        <header className="tailored-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="tailored-page-title">Tailor your application</h1>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#344054',
              backgroundColor: '#f2f4f7',
              border: '1px solid #eaecf0',
              padding: '3px 8px',
              borderRadius: '12px'
            }}>
              AI generation coming soon
            </span>
          </div>
          <p className="tailored-page-sub">
            AI tailoring will adjust your resume highlights and draft a role-specific cover letter once connected to the backend.
          </p>
        </header>

        {/* Target Job Header Card */}
        <section className="tailored-job-card">
          <div className="tailored-job-left">
            <div className="tailored-job-logo">
              {currentJob.companyInitial || currentJob.company?.[0]?.toUpperCase() || 'N'}
            </div>
            <div className="tailored-job-meta">
              <h2 className="tailored-job-title">{currentJob.title}</h2>
              <p className="tailored-job-sub">
                {currentJob.company} · {currentJob.location} · {currentJob.workType || 'Hybrid'} · {currentJob.employmentType || 'Full-time'}
              </p>
            </div>
          </div>
          <div className="tailored-job-fit-pill">
            <span>{fitScore}% fit</span>
          </div>
        </section>

        {/* Two Equal Columns: Tailored Resume (Left) + Cover Letter (Right) */}
        <div className="tailored-two-col-grid">
          {/* Left Column: Tailored Resume */}
          <div className="tailored-col-card">
            <div className="tailored-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="tailored-card-title">Resume preview</h3>
                <span style={{ fontSize: '11px', color: '#667085', backgroundColor: '#f2f4f7', padding: '1px 6px', borderRadius: '4px' }}>Sample</span>
              </div>
              <div className="tailored-pill-tabs">
                <button
                  type="button"
                  className={`tailored-pill-tab ${activeTab === 'tailored' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('tailored')}
                >
                  Tailored
                </button>
                <button
                  type="button"
                  className={`tailored-pill-tab ${activeTab === 'original' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('original')}
                >
                  Original
                </button>
              </div>
            </div>

            {/* Resume Preview Sheet */}
            <div className="tailored-resume-sheet">
              <div className="sheet-header">
                <h4 className="sheet-name">Alex Morgan</h4>
                <p className="sheet-meta">Product Designer · Budapest · alex.morgan@email.com</p>
              </div>

              <div className="sheet-section">
                <span className="sheet-section-title">SKILLS</span>
                <div className="sheet-highlight-box">
                  Figma & prototyping · User research · Design systems · Usability testing
                </div>
              </div>

              <div className="sheet-section">
                <span className="sheet-section-title">EXPERIENCE</span>
                <span className="sheet-sub-title">Product Designer, Acme Studio · 2019–2024</span>
                <div className="sheet-highlight-box">
                  Owned the shared design system used by four product squads, aligned with Northstar Labs’ design system ownership.
                </div>
                <div className="sheet-highlight-box" style={{ marginTop: 8 }}>
                  Ran research sessions with 30+ users to shape the onboarding flow and discovery workflow.
                </div>
              </div>

              <div className="sheet-section">
                <span className="sheet-section-title">EDUCATION</span>
                <span className="sheet-sub-title">MSc Interaction Design, MOME · 2021</span>
              </div>
            </div>

            <p className="tailored-resume-legend">
              <span className="legend-dot" /> Highlighted lines were adjusted by AI for this role
            </p>

            <div className="tailored-changes-box">
              <h5 className="changes-box-title">What changed</h5>
              <ul className="changes-list">
                <li className="changes-item">✓ Reordered skills to lead with Figma & prototyping</li>
                <li className="changes-item">✓ Linked design-system work to the team’s core workflow</li>
                <li className="changes-item">✓ Emphasised user research with 30+ participants</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Cover Letter */}
          <div className="tailored-col-card">
            {aiError && (
              <AiRateLimitBanner
                error={aiError}
                onRetry={() => {}}
                onDismiss={() => setAiError(null)}
              />
            )}

            <div className="tailored-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="tailored-card-title">Cover letter</h3>
                <span style={{ fontSize: '11px', color: '#667085', backgroundColor: '#f2f4f7', padding: '1px 6px', borderRadius: '4px' }}>Sample</span>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  color: '#98a2b3',
                  cursor: 'not-allowed',
                }}
                title="AI regeneration coming soon"
              >
                Regenerate (Coming soon)
              </span>
            </div>

            {/* Tone selector row */}
            <div className="tailored-tone-row">
              <span className="tone-label">Tone:</span>
              <div className="tone-chips">
                {['Professional', 'Friendly', 'Concise'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`tone-chip ${tone === t.toLowerCase() ? 'is-selected' : ''}`}
                    onClick={() => setTone(t.toLowerCase())}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Textarea */}
            <textarea
              className="tailored-letter-textarea"
              rows={14}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />

            <div className="tailored-coverage-banner">
              <span className="coverage-check">✓</span>
              <span>Your tailored application covers 9 of 10 key requirements for this role.</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="tailored-bottom-bar">
          <Link to="/matches" className="tailored-bar-back-btn">
            ← Back to options
          </Link>
          <div className="tailored-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#55695f' }}>
              Submission coming soon
            </span>
            <button
              type="button"
              className="tailored-bar-save-btn"
              onClick={() => navigate('/matches')}
            >
              Save draft
            </button>
            <button
              type="button"
              className="tailored-bar-submit-btn"
              disabled={true}
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
              title="Application submission coming soon"
            >
              Submission coming soon
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
