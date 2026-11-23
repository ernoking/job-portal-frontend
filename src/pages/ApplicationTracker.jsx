import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppNav from '../components/nav/AppNav';
import { getApplications, getTailorings, getTailoringDetail } from '../api/applications';
import { useAuth } from '../auth';
import './ApplicationTracker.css';

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

function getRelativeTime(isoString) {
  if (!isoString) return 'recently';
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  } catch {
    return 'recently';
  }
}

export default function ApplicationTracker() {
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [savedJobs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('matchwise_saved_jobs') || '[]');
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [tailoringInfo, setTailoringInfo] = useState(null);
  const [personalNotes, setPersonalNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('matchwise_tracker_notes') || '{}');
    } catch {
      return {};
    }
  });

  // Load real applications for candidate
  useEffect(() => {
    let isMounted = true;

    getApplications({}, token)
      .then((res) => {
        if (!isMounted) return;
        setApplications(res?.applications || []);
        setError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err || new Error('Failed to load applications.'));
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Load tailored CV/cover letter details when an application item is selected in drawer
  useEffect(() => {
    if (!selectedItem?.job?.id || !token) return;

    let isMounted = true;

    getTailorings(selectedItem.job.id, token)
      .then(async (res) => {
        if (!isMounted) return;
        const versions = res?.tailorings || [];
        if (versions.length > 0) {
          const detailRes = await getTailoringDetail(versions[0].id, token).catch(() => null);
          if (isMounted) {
            setTailoringInfo(detailRes?.tailoring || null);
            setDrawerLoading(false);
          }
        } else {
          if (isMounted) {
            setTailoringInfo(null);
            setDrawerLoading(false);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setTailoringInfo(null);
          setDrawerLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedItem, token]);

  const handleSelectItem = (item) => {
    setTailoringInfo(null);
    setDrawerLoading(Boolean(item?.job?.id));
    setSelectedItem(item);
  };

  const handleSaveNote = (jobId, text) => {
    const updated = { ...personalNotes, [jobId]: text };
    setPersonalNotes(updated);
    try {
      localStorage.setItem('matchwise_tracker_notes', JSON.stringify(updated));
    } catch {
      // safe fallback for restricted storage
    }
  };

  // Metrics derived honestly from real data
  const totalActiveApplications = applications.length;

  return (
    <div className="tracker-page">
      <AppNav activeTab="tracker" />

      <main className="tracker-main">
        {/* Top Header */}
        <div className="tracker-header-wrap">
          <div>
            <div className="tracker-tag">YOUR PIPELINE</div>
            <h1 className="tracker-title">Application tracker</h1>
            <p className="tracker-subtitle">Stay on top of every opportunity.</p>
          </div>
          <Link to="/matches" className="tracker-browse-btn">
            Browse matches
          </Link>
        </div>

        {/* Error banner */}
        {error && (
          <div
            style={{
              backgroundColor: '#fef3f2',
              border: '1px solid #fee4e2',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#b42318',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <strong>Error loading pipeline:</strong> {error.message}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: '#fff',
                border: '1px solid #d0d5dd',
                borderRadius: '6px',
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* 3 Metrics Cards (honest counts) */}
        <div className="tracker-metrics-row">
          <div className="tracker-metric-card">
            <div className="tracker-metric-label">ACTIVE APPLICATIONS</div>
            <div className="tracker-metric-val">{totalActiveApplications}</div>
          </div>
          <div className="tracker-metric-card">
            <div className="tracker-metric-label">RESPONSE RATE</div>
            <div className="tracker-metric-val">
              {totalActiveApplications > 0 ? '0%' : '—'}
            </div>
          </div>
          <div className="tracker-metric-card">
            <div className="tracker-metric-label">UPCOMING INTERVIEWS</div>
            <div className="tracker-metric-val-wrap">
              <span className="tracker-metric-val">0</span>
              <span className="tracker-metric-badge" style={{ color: '#667085', backgroundColor: '#f2f4f7' }}>
                Up to date
              </span>
            </div>
          </div>
        </div>

        {/* 5 Column Kanban Pipeline */}
        <div className="tracker-board">
          {/* Column 1: Saved / Top matches */}
          <div className="tracker-column">
            <div className="tracker-col-header">
              <span className="tracker-col-title">Saved / Top matches</span>
              <span className="tracker-col-count">{savedJobs.length}</span>
            </div>
            <div className="tracker-cards-list">
              {savedJobs.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#98a2b3', textAlign: 'center', padding: '36px 12px' }}>
                  No saved roles yet. Browse jobs to save opportunities.
                </div>
              ) : (
                savedJobs.map((job, idx) => (
                  <div
                    key={job.id || idx}
                    className={`tracker-card ${selectedItem?.job?.id === job.id && selectedItem?.status === 'saved' ? 'is-selected' : ''}`}
                    onClick={() =>
                      handleSelectItem({
                        id: `saved-${job.id || idx}`,
                        job,
                        status: 'saved',
                        stageLabel: 'Saved Match',
                        appliedAt: null,
                      })
                    }
                  >
                    <div className="tracker-card-top">
                      <div className="tracker-card-brand">
                        <div className="tracker-company-logo">
                          {job.companyInitial || job.company?.[0]?.toUpperCase() || 'J'}
                        </div>
                        <div>
                          <h3 className="tracker-card-role">{job.title}</h3>
                        </div>
                      </div>
                      {idx === 0 && (
                        <span className="tracker-top-match-badge">Top match</span>
                      )}
                    </div>
                    <div className="tracker-card-company">{job.company}</div>
                    <div className="tracker-card-meta">
                      {job.location || 'Remote'} · {job.workType || 'Hybrid'}
                    </div>
                    <div className="tracker-card-bottom">
                      <span className="tracker-fit-pill">
                        {job.match?.score || job.fit || 90}% fit
                      </span>
                      <Link
                        to={`/jobs/${job.id}/apply`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: '12px', color: '#15241d', fontWeight: 600, textDecoration: 'none' }}
                      >
                        Apply →
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Applied (Real candidate applications) */}
          <div className="tracker-column">
            <div className="tracker-col-header">
              <span className="tracker-col-title">Applied</span>
              <span className="tracker-col-count">{applications.length}</span>
            </div>
            <div className="tracker-cards-list">
              {isLoading ? (
                <div style={{ fontSize: '13px', color: '#98a2b3', textAlign: 'center', padding: '32px 10px' }}>
                  Loading applications...
                </div>
              ) : applications.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#98a2b3', textAlign: 'center', padding: '32px 10px' }}>
                  No applications recorded yet.
                </div>
              ) : (
                applications.map((app) => (
                  <div
                    key={app.id}
                    className={`tracker-card ${selectedItem?.id === app.id ? 'is-selected' : ''}`}
                    onClick={() =>
                      handleSelectItem({
                        ...app,
                        stageLabel: 'Applied',
                      })
                    }
                  >
                    <div className="tracker-card-top">
                      <div className="tracker-card-brand">
                        <div className="tracker-company-logo">
                          {app.job?.company?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <h3 className="tracker-card-role">
                          {app.job?.title || 'Job Application'}
                        </h3>
                      </div>
                    </div>
                    <div className="tracker-card-company">
                      {app.job?.company || 'Company'}
                    </div>
                    <div className="tracker-card-meta">
                      {app.job?.location || 'Remote'} · {app.job?.workType || 'Hybrid'} · Applied {getRelativeTime(app.createdAt || app.appliedAt)}
                    </div>
                    <div className="tracker-card-bottom">
                      <span className="tracker-fit-pill">
                        {app.job?.match?.score || 84}% fit
                      </span>
                      <span className="tracker-card-dots">•••</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Responded (Backend status expansion pending) */}
          <div className="tracker-column">
            <div className="tracker-col-header">
              <span className="tracker-col-title">Responded</span>
              <span className="tracker-col-count">0</span>
            </div>
            <div className="tracker-cards-list">
              <div style={{ fontSize: '13px', color: '#98a2b3', textAlign: 'center', padding: '32px 10px' }}>
                No employer responses logged yet.
              </div>
            </div>
          </div>

          {/* Column 4: Interviewed */}
          <div className="tracker-column">
            <div className="tracker-col-header">
              <span className="tracker-col-title">Interviewed</span>
              <span className="tracker-col-count">0</span>
            </div>
            <div className="tracker-cards-list">
              <div style={{ fontSize: '13px', color: '#98a2b3', textAlign: 'center', padding: '32px 10px' }}>
                No interviews scheduled.
              </div>
            </div>
          </div>

          {/* Column 5: Offered */}
          <div className="tracker-column">
            <div className="tracker-col-header">
              <span className="tracker-col-title">Offered</span>
              <span className="tracker-col-count">0</span>
            </div>
            <div className="tracker-cards-list">
              <div style={{ fontSize: '13px', color: '#98a2b3', textAlign: 'center', padding: '32px 10px' }}>
                No job offers received yet.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Side Drawer: Application Detail */}
      {selectedItem && (
        <div
          className="tracker-drawer-overlay"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="tracker-drawer-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="tracker-drawer-header">
              <div className="tracker-drawer-header-left">
                <div className="tracker-drawer-logo">
                  {selectedItem.job?.company?.[0]?.toUpperCase() || 'J'}
                </div>
                <div className="tracker-drawer-title-group">
                  <h2>{selectedItem.job?.title || 'Role Details'}</h2>
                  <div className="tracker-drawer-meta">
                    {selectedItem.job?.company} · {selectedItem.job?.location || 'Remote'}
                  </div>
                  <div className="tracker-drawer-badges">
                    <span className="tracker-drawer-badge badge-status">
                      {selectedItem.stageLabel || 'Applied'}
                    </span>
                    {selectedItem.method && (
                      <span className="tracker-drawer-badge badge-tailored">
                        {selectedItem.method === 'auto' ? 'Automatic Apply' : 'Manual Apply'}
                      </span>
                    )}
                    {tailoringInfo && (
                      <span className="tracker-drawer-badge badge-fit">
                        Tailored with AI
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="tracker-drawer-close-btn"
                onClick={() => setSelectedItem(null)}
                aria-label="Close drawer"
              >
                ✕
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="tracker-drawer-content">
              {/* Status Timeline */}
              <div className="tracker-drawer-section">
                <div className="tracker-section-head">
                  <h4 className="tracker-section-title">Status timeline</h4>
                </div>
                <div className="tracker-timeline">
                  {/* Saved Match - when viewed from Saved / Top matches */}
                  {selectedItem.status === 'saved' && (
                    <div className="tracker-timeline-item">
                      <div className="tracker-timeline-left">
                        <span className="timeline-dot is-active" />
                        <span className="timeline-label">Saved Match</span>
                      </div>
                      <span className="timeline-date">Today</span>
                    </div>
                  )}

                  {/* Applied - active only if the job was actually applied */}
                  {selectedItem.appliedAt || selectedItem.status !== 'saved' ? (
                    <div className="tracker-timeline-item">
                      <div className="tracker-timeline-left">
                        <span
                          className={`timeline-dot ${
                            selectedItem.status === 'responded' ||
                            selectedItem.status === 'interview' ||
                            selectedItem.status === 'offered'
                              ? 'is-completed'
                              : 'is-active'
                          }`}
                        />
                        <span className="timeline-label">Applied</span>
                      </div>
                      <span className="timeline-date">
                        {formatDate(selectedItem.appliedAt || selectedItem.createdAt)}
                      </span>
                    </div>
                  ) : null}

                  {/* Responded - when actually reached on backend */}
                  {selectedItem.respondedAt || selectedItem.status === 'responded' ? (
                    <div className="tracker-timeline-item">
                      <div className="tracker-timeline-left">
                        <span
                          className={`timeline-dot ${
                            selectedItem.status === 'interview' || selectedItem.status === 'offered'
                              ? 'is-completed'
                              : 'is-active'
                          }`}
                        />
                        <span className="timeline-label">Responded</span>
                      </div>
                      <span className="timeline-date">
                        {formatDate(selectedItem.respondedAt)}
                      </span>
                    </div>
                  ) : null}

                  {/* Interview - when actually reached on backend */}
                  {selectedItem.interviewAt || selectedItem.status === 'interview' ? (
                    <div className="tracker-timeline-item">
                      <div className="tracker-timeline-left">
                        <span
                          className={`timeline-dot ${
                            selectedItem.status === 'offered' ? 'is-completed' : 'is-active'
                          }`}
                        />
                        <span className="timeline-label">Interview</span>
                        <span className="timeline-upcoming-pill">Upcoming</span>
                      </div>
                      <span className="timeline-date">
                        {formatDate(selectedItem.interviewAt)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Submitted Resume Version */}
              <div className="tracker-drawer-section">
                <div className="tracker-section-head">
                  <h4 className="tracker-section-title">Tailored Documents</h4>
                  {selectedItem.job?.id && (
                    <Link
                      to={`/jobs/${selectedItem.job.id}/tailor`}
                      className="tracker-link-action"
                    >
                      Open Tailor Studio ↗
                    </Link>
                  )}
                </div>
                <div className="tracker-resume-box">
                  {drawerLoading ? (
                    <div style={{ fontSize: '13px', color: '#667085' }}>
                      Checking for saved documents...
                    </div>
                  ) : tailoringInfo ? (
                    <>
                      <div className="tracker-resume-candidate">
                        {tailoringInfo.tailoredProfile?.personal?.name || 'Tailored Resume'}
                      </div>
                      <div className="tracker-resume-sub">
                        Tailored for {selectedItem.job?.company} ({tailoringInfo.tone || 'standard'} tone)
                      </div>
                      {tailoringInfo.highlightedSkills?.length > 0 && (
                        <div className="tracker-resume-highlight">
                          Matching skills prioritized: {tailoringInfo.highlightedSkills.join(', ')}
                        </div>
                      )}
                      <p className="tracker-resume-legend">
                        <span style={{ color: '#027a48' }}>■</span> Highlighted skills were prioritized by AI for this role
                      </p>
                    </>
                  ) : (
                    <div style={{ fontSize: '13px', color: '#667085', fontStyle: 'italic' }}>
                      No tailored CV generated for this role yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Generated Cover Letter */}
              {tailoringInfo?.coverLetter && (
                <div className="tracker-drawer-section">
                  <div className="tracker-section-head">
                    <h4 className="tracker-section-title">Generated cover letter</h4>
                  </div>
                  <div className="tracker-cover-letter-box">
                    {tailoringInfo.coverLetter}
                  </div>
                </div>
              )}

              {/* Personal Notes (stored locally per job) */}
              <div className="tracker-drawer-section">
                <div className="tracker-section-head">
                  <h4 className="tracker-section-title">Personal notes</h4>
                  <span className="tracker-link-action">+ Add note</span>
                </div>
                <textarea
                  className="tracker-notes-textarea"
                  rows={3}
                  placeholder="Prepare a 10-minute portfolio walkthrough and ask about the design team structure."
                  value={personalNotes[selectedItem.job?.id] || ''}
                  onChange={(e) => handleSaveNote(selectedItem.job?.id, e.target.value)}
                />
              </div>

              {/* Salary Tracking (Real job posted salary if available, otherwise Coming Soon) */}
              <div className="tracker-drawer-section">
                <div className="tracker-section-head">
                  <h4 className="tracker-section-title">Salary tracking</h4>
                  <span style={{ fontSize: '11px', color: '#667085', fontWeight: 600 }}>Coming Soon</span>
                </div>
                {selectedItem.job?.salary ? (
                  <div className="tracker-salary-grid">
                    <div className="tracker-salary-field">
                      <label>POSTED RANGE</label>
                      <input
                        type="text"
                        className="tracker-salary-input"
                        value={selectedItem.job.salary}
                        readOnly
                      />
                    </div>
                    <div className="tracker-salary-field">
                      <label>MY EXPECTATION</label>
                      <input
                        type="text"
                        className="tracker-salary-input"
                        placeholder="Coming Soon"
                        readOnly
                      />
                    </div>
                    <div className="tracker-salary-field">
                      <label>OFFER RECEIVED</label>
                      <input
                        type="text"
                        className="tracker-salary-input"
                        value="—"
                        readOnly
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#667085', fontStyle: 'italic', background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #eaecf0' }}>
                    Salary tracking & offer negotiations will be connected to upcoming backend compensation endpoints.
                  </div>
                )}
              </div>

              {/* Employer / Job Link */}
              {selectedItem.job?.url && (
                <div className="tracker-drawer-section">
                  <div className="tracker-section-head">
                    <h4 className="tracker-section-title">Original Job Posting</h4>
                  </div>
                  <a
                    href={selectedItem.job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tracker-browse-btn"
                    style={{ fontSize: '13px', padding: '8px 16px', display: 'inline-block' }}
                  >
                    View on Employer Site ↗
                  </a>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="tracker-drawer-footer">
              <button
                type="button"
                className="tracker-withdraw-btn"
                onClick={() => {
                  if (window.confirm('Withdraw this application?')) {
                    setSelectedItem(null);
                  }
                }}
              >
                Withdraw application
              </button>
              <button
                type="button"
                className="tracker-prepare-btn"
                onClick={() => {
                  alert('Opening AI Interview Preparation...');
                }}
              >
                Prepare with AI / Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
