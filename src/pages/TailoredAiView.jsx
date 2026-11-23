import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppNav from '../components/nav/AppNav';
import AiRateLimitBanner from '../components/common/AiRateLimitBanner';
import { getMatchDetail } from '../api/jobs';
import { getProfile } from '../api/profile';
import {
  generateTailoring,
  getTailorings,
  getTailoringDetail,
  downloadTailoredDoc,
  applyToJob,
} from '../api/applications';
import { useAuth } from '../auth';
import { MOCK_JOBS } from '../mocks/jobs';
import './TailoredAiView.css';

export default function TailoredAiView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [job, setJob] = useState(null);
  const [baseProfile, setBaseProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tailored'); // 'tailored' | 'original'
  const [tone, setTone] = useState('professional'); // 'professional' | 'friendly' | 'concise'
  const [aiError, setAiError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tailoringData, setTailoringData] = useState(null);
  const [savedVersions, setSavedVersions] = useState([]);
  const [isDownloadingResume, setIsDownloadingResume] = useState(false);
  const [isDownloadingLetter, setIsDownloadingLetter] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [externalApplyUrl, setExternalApplyUrl] = useState(null);

  const [coverLetter, setCoverLetter] = useState('');

  // Loads base profile, job details, and any existing saved tailorings on mount
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        let jobData = null;
        if (id) {
          jobData = await getMatchDetail(id).catch(() => null);
        }
        if (!jobData) {
          jobData = MOCK_JOBS.find((j) => j.id === id) || MOCK_JOBS[0];
        }

        const profileData = await getProfile().catch(() => null);

        let versions = [];
        let latestTailoring = null;
        if (id && token) {
          const tailoringsRes = await getTailorings(id, token).catch(() => null);
          if (tailoringsRes?.tailorings?.length > 0) {
            versions = tailoringsRes.tailorings;
            const latestId = versions[0].id;
            const detailRes = await getTailoringDetail(latestId, token).catch(() => null);
            latestTailoring = detailRes?.tailoring || null;
          }
        }

        if (isMounted) {
          setJob(jobData);
          if (profileData) setBaseProfile(profileData);
          setSavedVersions(versions);
          if (latestTailoring) {
            setTailoringData(latestTailoring);
            if (latestTailoring.tone) setTone(latestTailoring.tone);
            if (latestTailoring.coverLetter) setCoverLetter(latestTailoring.coverLetter);
          }
          setIsLoading(false);
        }
      } catch {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, token]);

  const handleGenerate = useCallback(
    async (selectedTone = tone) => {
      const targetId = job?.id || id;
      if (!targetId || isGenerating) return;

      setIsGenerating(true);
      setAiError(null);
      try {
        const res = await generateTailoring(targetId, { tone: selectedTone }, token);
        if (res?.tailoring) {
          setTailoringData(res.tailoring);
          setSavedVersions((prev) => [res.tailoring, ...prev]);
          if (res.tailoring.coverLetter) {
            setCoverLetter(res.tailoring.coverLetter);
          }
        }
      } catch (err) {
        setAiError(err);
      } finally {
        setIsGenerating(false);
      }
    },
    [job?.id, id, tone, token, isGenerating]
  );

  const handleToneChange = (newTone) => {
    setTone(newTone);
    handleGenerate(newTone);
  };

  const handleSelectVersion = async (versionId) => {
    if (!versionId || versionId === tailoringData?.id) return;
    try {
      const detailRes = await getTailoringDetail(versionId, token);
      if (detailRes?.tailoring) {
        setTailoringData(detailRes.tailoring);
        if (detailRes.tailoring.tone) setTone(detailRes.tailoring.tone);
        if (detailRes.tailoring.coverLetter) setCoverLetter(detailRes.tailoring.coverLetter);
      }
    } catch (err) {
      alert(`Unable to load version: ${err.message}`);
    }
  };

  const handleDownload = async (type) => {
    try {
      if (type === 'resume') {
        if (!tailoringData?.id) return;
        setIsDownloadingResume(true);
        const blob = await downloadTailoredDoc(tailoringData.id, type, token);
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `tailored-cv-${job?.company || 'job'}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      } else if (type === 'cover-letter') {
        setIsDownloadingLetter(true);
        // Download the exact edited cover letter content reviewed by the user
        const contentToDownload = coverLetter || tailoringData?.coverLetter || '';
        const blob = new Blob([contentToDownload], { type: 'text/plain;charset=utf-8' });
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `cover-letter-${job?.company || 'job'}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      }
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

  // Active displayed profile: tailoredProfile if on 'tailored' tab and generated; else baseProfile
  const profileToDisplay =
    activeTab === 'tailored' && tailoringData?.tailoredProfile
      ? tailoringData.tailoredProfile
      : baseProfile || {
          personal: { name: 'Candidate Profile', email: 'Upload and review CV first' },
          skills: [],
          experienceEducation: [],
        };

  const highlightedSkillsSet = new Set(tailoringData?.highlightedSkills || []);
  const highlightedExpSet = new Set(
    (tailoringData?.highlightedExperience || []).map((e) => `${e.role || ''}-${e.organization || ''}`)
  );

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {savedVersions.length > 1 && (
                <select
                  value={tailoringData?.id || ''}
                  onChange={(e) => handleSelectVersion(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d0d5dd',
                    fontSize: '13px',
                    backgroundColor: '#fff',
                  }}
                  aria-label="Select saved version"
                >
                  {savedVersions.map((v, i) => (
                    <option key={v.id} value={v.id}>
                      Version {savedVersions.length - i} ({v.tone || 'standard'})
                    </option>
                  ))}
                </select>
              )}
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
                <h3 className="tailored-card-title">
                  {activeTab === 'tailored' ? 'Tailored Resume' : 'Original Base Profile'}
                </h3>
                {tailoringData ? (
                  <span style={{ fontSize: '11px', color: '#027a48', backgroundColor: '#ecfdf3', padding: '1px 6px', borderRadius: '4px' }}>
                    {activeTab === 'tailored' ? 'AI Tailored' : 'Base Version'}
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', color: '#667085', backgroundColor: '#f2f4f7', padding: '1px 6px', borderRadius: '4px' }}>
                    Untailored Base
                  </span>
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
                <h4 className="sheet-name">{profileToDisplay?.personal?.name || 'Candidate Profile'}</h4>
                <p className="sheet-meta">
                  {[profileToDisplay?.personal?.email, profileToDisplay?.personal?.phone, profileToDisplay?.personal?.location]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>

              {profileToDisplay?.skills?.length > 0 ? (
                <div className="sheet-section">
                  <span className="sheet-section-title">SKILLS</span>
                  <div className="sheet-highlight-box" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {profileToDisplay.skills.map((skill, idx) => {
                      const isHighlighted = activeTab === 'tailored' && highlightedSkillsSet.has(skill);
                      return (
                        <span
                          key={idx}
                          style={{
                            fontWeight: isHighlighted ? 700 : 400,
                            color: isHighlighted ? '#027a48' : '#15241d',
                            backgroundColor: isHighlighted ? '#edfcf2' : 'transparent',
                            padding: isHighlighted ? '2px 6px' : 0,
                            borderRadius: '4px',
                          }}
                        >
                          {skill}{idx < profileToDisplay.skills.length - 1 ? ' ·' : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="sheet-section" style={{ color: '#667085', fontSize: '13px', fontStyle: 'italic' }}>
                  No skills recorded in profile yet.
                </div>
              )}

              {profileToDisplay?.experienceEducation?.length > 0 ? (
                <div className="sheet-section">
                  <span className="sheet-section-title">EXPERIENCE & EDUCATION</span>
                  {profileToDisplay.experienceEducation.map((item, idx) => {
                    const isHighlighted =
                      activeTab === 'tailored' &&
                      highlightedExpSet.has(`${item.role || ''}-${item.organization || ''}`);
                    return (
                      <div
                        key={idx}
                        className="sheet-highlight-box"
                        style={{
                          marginTop: idx > 0 ? 8 : 0,
                          backgroundColor: isHighlighted ? '#edfcf2' : '#ffffff',
                          border: isHighlighted ? '1px solid #73e2a3' : '1px solid #eaecf0',
                          padding: '10px',
                          borderRadius: '6px',
                        }}
                      >
                        <span className="sheet-sub-title" style={{ display: 'block', fontWeight: 600 }}>
                          {[item.role, item.organization, item.period].filter(Boolean).join(' · ')}
                        </span>
                        {item.description && (
                          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#55695f' }}>
                            {item.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="sheet-section" style={{ color: '#667085', fontSize: '13px', fontStyle: 'italic' }}>
                  No experience or education recorded in profile yet.
                </div>
              )}
            </div>

            {activeTab === 'tailored' && tailoringData && (
              <>
                <p className="tailored-resume-legend">
                  <span className="legend-dot" /> Highlighted skills and experiences were prioritized by AI for this role
                </p>

                <div className="tailored-changes-box">
                  <h5 className="changes-box-title">AI Fact Alignment</h5>
                  <ul className="changes-list">
                    {tailoringData.highlightedSkills?.length > 0 && (
                      <li className="changes-item">
                        ✓ Prioritized matching skills: {tailoringData.highlightedSkills.join(', ')}
                      </li>
                    )}
                    {tailoringData.highlightedExperience?.length > 0 && (
                      <li className="changes-item">
                        ✓ Highlighted relevant background: {tailoringData.highlightedExperience.map((e) => e.role || e.organization).join(', ')}
                      </li>
                    )}
                    <li className="changes-item">
                      ✓ Ranked using strict fact verification against your uploaded profile
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Right Column: Cover Letter */}
          <div className="tailored-col-card">
            {aiError && (
              <AiRateLimitBanner
                error={aiError}
                onRetry={() => handleGenerate(tone)}
                onDismiss={() => setAiError(null)}
              />
            )}

            <div className="tailored-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="tailored-card-title">Cover letter</h3>
                {tailoringData ? (
                  <span style={{ fontSize: '11px', color: '#027a48', backgroundColor: '#ecfdf3', padding: '1px 6px', borderRadius: '4px' }}>
                    AI Generated
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', color: '#667085', backgroundColor: '#f2f4f7', padding: '1px 6px', borderRadius: '4px' }}>
                    Empty (Generate to preview)
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {coverLetter && (
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
                    disabled={isGenerating}
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
              placeholder="Click 'Generate Tailored Documents' above to generate a grounded cover letter tailored to this role."
              onChange={(e) => setCoverLetter(e.target.value)}
              disabled={isGenerating}
            />
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
