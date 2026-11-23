import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppNav from '../components/nav/AppNav';
import AiRateLimitBanner from '../components/common/AiRateLimitBanner';
import { getMatchDetail } from '../api/jobs';
import { generateTailoring, downloadTailoredDoc, applyToJob } from '../api/applications';
import { useAuth } from '../auth';
import { MOCK_JOBS } from '../mocks/jobs';
import './TailoredAiView.css';

export default function TailoredAiView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tailored'); // 'tailored' | 'original'
  const [tone, setTone] = useState('professional'); // 'professional' | 'friendly' | 'concise'
  const [aiError, setAiError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tailoringData, setTailoringData] = useState(null);
  const [isDownloadingResume, setIsDownloadingResume] = useState(false);
  const [isDownloadingLetter, setIsDownloadingLetter] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [externalApplyUrl, setExternalApplyUrl] = useState(null);

  const [coverLetter, setCoverLetter] = useState('');

  const handleGenerate = useCallback(async (selectedTone = tone) => {
    const targetId = job?.id || id;
    if (!targetId) return;

    setIsGenerating(true);
    setAiError(null);
    try {
      const res = await generateTailoring(targetId, { tone: selectedTone }, token);
      if (res?.tailoring) {
        setTailoringData(res.tailoring);
        if (res.tailoring.coverLetter) {
          setCoverLetter(res.tailoring.coverLetter);
        }
      }
    } catch (err) {
      if (err?.status === 429) {
        setAiError(err);
      } else {
        setAiError({
          status: err?.status || 500,
          message: err?.message || 'Unable to tailor application documents right now. Please try again.',
        });
      }
    } finally {
      setIsGenerating(false);
    }
  }, [job?.id, id, tone, token]);

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

  const handleToneChange = (newTone) => {
    setTone(newTone);
    handleGenerate(newTone);
  };

  const handleDownload = async (type) => {
    if (!tailoringData?.id) return;
    try {
      if (type === 'resume') setIsDownloadingResume(true);
      if (type === 'cover-letter') setIsDownloadingLetter(true);

      const blob = await downloadTailoredDoc(tailoringData.id, type, token);
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${type === 'resume' ? 'tailored-cv' : 'tailored-cover-letter'}-${job?.company || 'job'}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    } finally {
      if (type === 'resume') setIsDownloadingResume(false);
      if (type === 'cover-letter') setIsDownloadingLetter(false);
    }
  };

  const handleApply = async () => {
    const targetJobId = job?.id || id;
    if (!targetJobId) return;

    setIsSubmitting(true);
    setApplyError('');
    try {
      const res = await applyToJob(targetJobId, token);
      setApplySuccess(true);
      const targetUrl = res?.applyUrl || job?.url;
      if (targetUrl) {
        setExternalApplyUrl(targetUrl);
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      if (err?.data?.error?.code === 'ALREADY_APPLIED') {
        setApplyError('You have already applied to this job.');
      } else if (err?.data?.error?.code === 'JOB_CLOSED') {
        setApplyError('This job is no longer open for applications.');
      } else {
        setApplyError(err?.message || 'Unable to record your application.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };





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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 className="tailored-page-title">Tailor your application</h1>
              <p className="tailored-page-sub">
                AI customises your CV profile highlights and crafts a role-tailored cover letter based on your real profile.
              </p>
            </div>
            <button
              type="button"
              className="tailored-generate-btn"
              onClick={() => handleGenerate(tone)}
              disabled={isGenerating}
              style={{
                backgroundColor: '#15241d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontWeight: 600,
                cursor: isGenerating ? 'wait' : 'pointer',
                opacity: isGenerating ? 0.7 : 1,
              }}
            >
              {isGenerating ? 'Tailoring with AI...' : '✨ Generate Tailored Documents'}
            </button>
          </div>
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
                <h3 className="tailored-card-title">Tailored Resume</h3>
                {tailoringData ? (
                  <span style={{ fontSize: '11px', color: '#027a48', backgroundColor: '#ecfdf3', padding: '1px 6px', borderRadius: '4px' }}>AI Tailored</span>
                ) : (
                  <span style={{ fontSize: '11px', color: '#667085', backgroundColor: '#f2f4f7', padding: '1px 6px', borderRadius: '4px' }}>Draft</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {tailoringData?.id && (
                  <button
                    type="button"
                    onClick={() => handleDownload('resume')}
                    disabled={isDownloadingResume}
                    style={{
                      background: 'none',
                      border: '1px solid #d0d5dd',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {isDownloadingResume ? 'Downloading...' : '⬇ Download CV (.txt)'}
                  </button>
                )}
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
                {tailoringData ? (
                  <span style={{ fontSize: '11px', color: '#027a48', backgroundColor: '#ecfdf3', padding: '1px 6px', borderRadius: '4px' }}>AI Tailored</span>
                ) : (
                  <span style={{ fontSize: '11px', color: '#667085', backgroundColor: '#f2f4f7', padding: '1px 6px', borderRadius: '4px' }}>Draft</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {tailoringData?.id && (
                  <button
                    type="button"
                    onClick={() => handleDownload('cover-letter')}
                    disabled={isDownloadingLetter}
                    style={{
                      background: 'none',
                      border: '1px solid #d0d5dd',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {isDownloadingLetter ? 'Downloading...' : '⬇ Download (.txt)'}
                  </button>
                )}
                <button
                  type="button"
                  className="tailored-regenerate-link"
                  disabled={isGenerating}
                  onClick={() => handleGenerate(tone)}
                  style={{ cursor: isGenerating ? 'wait' : 'pointer' }}
                >
                  {isGenerating ? 'Generating...' : 'Regenerate'}
                </button>
              </div>
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
                    onClick={() => handleToneChange(t.toLowerCase())}
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

          {applySuccess ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#027a48', fontWeight: 600, fontSize: '13px' }}>
                ✓ Application logged in Matchwise
              </span>
              {externalApplyUrl && (
                <a
                  href={externalApplyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tailored-bar-submit-btn"
                  style={{ textDecoration: 'none', display: 'inline-block' }}
                >
                  Open Employer Site ↗
                </a>
              )}
            </div>
          ) : (
            <div className="tailored-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {applyError && (
                <span style={{ fontSize: '13px', color: '#b42318' }}>
                  {applyError}
                </span>
              )}
              <button
                type="button"
                className="tailored-bar-save-btn"
                onClick={() => navigate('/matches')}
              >
                Back to Feed
              </button>
              <button
                type="button"
                className="tailored-bar-submit-btn"
                onClick={handleApply}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Recording...' : 'Apply on employer website →'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
