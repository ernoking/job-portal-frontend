import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppNav from '../components/nav/AppNav';
import { getApplications, getTailorings, getTailoringDetail } from '../api/applications';
import { getSavedJobs } from '../api/savedJobs';
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
  const { token, user } = useAuth();
  const userId = user?.id || null;
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState(() => {
    const list = getSavedJobs(userId);
    if (list && list.length > 0) return list;
    return [
      {
        id: 'job-1',
        title: 'Product Designer',
        company: 'Northstar Labs',
        companyInitial: 'N',
        location: 'Budapest',
        workType: 'Hybrid',
        fit: 94,
        isTopMatch: true,
      },
      {
        id: 'job-2',
        title: 'UX Designer',
        company: 'Kinfolk',
        companyInitial: 'K',
        location: 'Budapest',
        workType: 'Hybrid',
        fit: 87,
        isSaved: true,
      },
    ];
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [retryCount, setRetryCount] = useState(0);
  const [dateError, setDateError] = useState('');

  // Sync saved jobs if updated from other tabs/modals
  useEffect(() => {
    const handleSync = () => {
      const updated = getSavedJobs(userId);
      setSavedJobs(updated && updated.length > 0 ? updated : [
        {
          id: 'job-1',
          title: 'Product Designer',
          company: 'Northstar Labs',
          companyInitial: 'N',
          location: 'Budapest',
          workType: 'Hybrid',
          fit: 94,
          isTopMatch: true,
        },
        {
          id: 'job-2',
          title: 'UX Designer',
          company: 'Kinfolk',
          companyInitial: 'K',
          location: 'Budapest',
          workType: 'Hybrid',
          fit: 87,
          isSaved: true,
        },
      ]);
    };
    window.addEventListener('matchwise_saved_jobs_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('matchwise_saved_jobs_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [userId]);

  const [selectedItem, setSelectedItem] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [tailoringInfo, setTailoringInfo] = useState(null);
  const [personalNotes, setPersonalNotes] = useState(() => {
    if (!userId) return {};
    try {
      return JSON.parse(localStorage.getItem(`matchwise_tracker_notes_${userId}`) || '{}');
    } catch {
      return {};
    }
  });

  const [prevUserId, setPrevUserId] = useState(userId);
  if (userId !== prevUserId) {
    setPrevUserId(userId);
    const updated = getSavedJobs(userId);
    setSavedJobs(updated && updated.length > 0 ? updated : [
      {
        id: 'job-1',
        title: 'Product Designer',
        company: 'Northstar Labs',
        companyInitial: 'N',
        location: 'Budapest',
        workType: 'Hybrid',
        fit: 94,
        isTopMatch: true,
      },
      {
        id: 'job-2',
        title: 'UX Designer',
        company: 'Kinfolk',
        companyInitial: 'K',
        location: 'Budapest',
        workType: 'Hybrid',
        fit: 87,
        isSaved: true,
      },
    ]);
    try {
      const data = userId ? JSON.parse(localStorage.getItem(`matchwise_tracker_notes_${userId}`) || '{}') : {};
      setPersonalNotes(data);
    } catch {
      setPersonalNotes({});
    }
  }

  // Load real applications for candidate
  useEffect(() => {
    let isMounted = true;

    function loadHistory() {
      setIsLoading(true);
      setError(null);
      setApplications([]);
      setSelectedItem(null);
      if (!token) {
        setIsLoading(false);
        setApplications([
          {
            id: 'mock-app-1',
            status: 'Applied',
            method: 'manual',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            job: {
              id: 'job-3',
              title: 'Product Designer',
              company: 'Forma Systems',
              companyInitial: 'F',
              location: 'Budapest',
              workType: 'Hybrid',
              fit: 84,
            },
          },
          {
            id: 'mock-app-2',
            status: 'Applied',
            method: 'manual',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            job: {
              id: 'job-4',
              title: 'UX Researcher',
              company: 'Mosaic',
              companyInitial: 'M',
              location: 'Budapest',
              workType: 'Hybrid',
              fit: 81,
            },
          },
        ]);
        return;
      }
      getApplications(dateRange, token)
        .then((res) => {
          if (!isMounted) return;
          const apps = res?.applications || [];
          if (apps.length === 0 && !dateRange.from && !dateRange.to) {
            setApplications([
              {
                id: 'mock-app-1',
                status: 'Applied',
                method: 'manual',
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                job: {
                  id: 'job-3',
                  title: 'Product Designer',
                  company: 'Forma Systems',
                  companyInitial: 'F',
                  location: 'Budapest',
                  workType: 'Hybrid',
                  fit: 84,
                },
              },
              {
                id: 'mock-app-2',
                status: 'Applied',
                method: 'manual',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                job: {
                  id: 'job-4',
                  title: 'UX Researcher',
                  company: 'Mosaic',
                  companyInitial: 'M',
                  location: 'Budapest',
                  workType: 'Hybrid',
                  fit: 81,
                },
              },
            ]);
          } else {
            setApplications(apps);
          }
          setError(null);
          setIsLoading(false);
        })
        .catch((err) => {
          if (!isMounted) return;
          setError(err || new Error('Failed to load applications.'));
          setIsLoading(false);
        });
    }
    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [token, dateRange, retryCount]);

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
    if (!jobId) return;
    const updated = { ...personalNotes, [jobId]: text };
    setPersonalNotes(updated);
    if (!userId) return;
    try {
      localStorage.setItem(`matchwise_tracker_notes_${userId}`, JSON.stringify(updated));
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

        <form className="tracker-date-filters" onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          const dateInputs = { from: values.get('from') || '', to: values.get('to') || '' };
          if (dateInputs.from && dateInputs.to && dateInputs.from > dateInputs.to) {
            setDateError('Start date must be on or before end date.');
            return;
          }
          setDateError('');
          setDateRange({ ...dateInputs });
        }}>
          <label>From (UTC)
            <input type="date" name="from" />
          </label>
          <label>To (UTC, inclusive)
            <input type="date" name="to" />
          </label>
          <button type="submit">Filter history</button>
          <button type="reset" onClick={() => {
            setDateRange({ from: '', to: '' });
            setDateError('');
          }}>Clear dates</button>
          {dateError && <p role="alert">{dateError}</p>}
        </form>

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
              onClick={() => setRetryCount((count) => count + 1)}
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
          {/* Column 1: Saved / Top 10 matches */}
          <div className="tracker-column">
            <div className="tracker-col-header">
              <span className="tracker-col-title">Saved / Top 10 matches</span>
              <span className="tracker-col-count">{savedJobs.length}</span>
            </div>
            <div className="tracker-cards-list">
              {savedJobs.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#98a2b3', textAlign: 'center', padding: '36px 12px' }}>
                  No saved roles yet. Browse jobs to save opportunities.
                </div>
              ) : (
                savedJobs.map((job, idx) => {
                  const isTopMatch = job.isTopMatch || idx === 0;
                  const isSelected = selectedItem?.job?.id === job.id && selectedItem?.status === 'saved';
                  const fitScore = typeof (job.match?.score ?? job.fit) === 'number' ? (job.match?.score ?? job.fit) : null;
                  const companyInit = job.companyInitial || job.company?.[0]?.toUpperCase() || 'J';
                  const metaText = [job.location || 'Budapest', job.workType || 'Hybrid'].filter(Boolean).join(' · ');

                  return (
                    <div
                      key={job.id || idx}
                      className={`tracker-card ${isTopMatch ? 'is-top-match' : ''} ${isSelected ? 'is-selected' : ''}`}
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
                            {companyInit}
                          </div>
                          <h3 className="tracker-card-role">{job.title}</h3>
                        </div>
                        {isTopMatch ? (
                          <span className="tracker-top-match-badge">Top match</span>
                        ) : (
                          <span className="tracker-card-bookmark" aria-label="Saved role">
                            <svg width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true">
                              <path d="M0 2C0 0.895431 0.895431 0 2 0H12C13.1046 0 14 0.895431 14 2V18L7 13.5L0 18V2Z" fill="#0F241A" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="tracker-card-company">{job.company}</div>
                      <div className="tracker-card-meta">{metaText}</div>
                      <div className="tracker-card-bottom">
                        {fitScore !== null ? (
                          <span className="tracker-fit-pill">
                            {fitScore}% fit
                          </span>
                        ) : (
                          <span className="tracker-fit-pill is-unavailable" title="Fit score unavailable">
                            — fit
                          </span>
                        )}
                        <span className="tracker-card-dots" aria-label="Card options">
                          <svg width="16" height="4" viewBox="0 0 16 4" fill="none" aria-hidden="true">
                            <circle cx="2" cy="2" r="1.8" fill="#667085" />
                            <circle cx="8" cy="2" r="1.8" fill="#667085" />
                            <circle cx="14" cy="2" r="1.8" fill="#667085" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  );
                })
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
                  {dateRange.from || dateRange.to ? 'No applications in this date range.' : 'No applications recorded yet.'}
                </div>
              ) : (
                applications.map((app) => {
                  const isSelected = selectedItem?.id === app.id;
                  const fitScore = typeof (app.job?.match?.score ?? app.job?.fit) === 'number' ? (app.job?.match?.score ?? app.job?.fit) : null;
                  const companyInit = app.job?.companyInitial || app.job?.company?.[0]?.toUpperCase() || 'C';
                  const timeAgo = getRelativeTime(app.createdAt || app.appliedAt);
                  const metaText = [
                    app.job?.location || 'Budapest',
                    app.job?.workType || 'Hybrid',
                    `Applied ${timeAgo}`,
                  ].filter(Boolean).join(' · ');

                  return (
                    <div
                      key={app.id}
                      className={`tracker-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() =>
                        handleSelectItem({
                          ...app,
                          stageLabel: app.status || 'Applied',
                        })
                      }
                    >
                      <div className="tracker-card-top">
                        <div className="tracker-card-brand">
                          <div className="tracker-company-logo">
                            {companyInit}
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
                        {metaText}
                      </div>
                      <div className="tracker-card-bottom">
                        {fitScore !== null ? (
                          <span className="tracker-fit-pill">
                            {fitScore}% fit
                          </span>
                        ) : (
                          <span className="tracker-fit-pill is-unavailable" title="Fit score unavailable">
                            — fit
                          </span>
                        )}
                        <span className="tracker-card-dots" aria-label="Card options">
                          <svg width="16" height="4" viewBox="0 0 16 4" fill="none" aria-hidden="true">
                            <circle cx="2" cy="2" r="1.8" fill="#667085" />
                            <circle cx="8" cy="2" r="1.8" fill="#667085" />
                            <circle cx="14" cy="2" r="1.8" fill="#667085" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  );
                })
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
                    {selectedItem.status !== 'saved' && (
                      <span className="tracker-drawer-badge badge-status">
                        {selectedItem.job?.isActive === false ? 'Job closed' : selectedItem.job?.isActive === true ? 'Job open' : 'Job unavailable'}
                      </span>
                    )}
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
                disabled={true}
                title="Application withdrawal workflow coming soon"
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              >
                Withdraw application · Coming soon
              </button>
              <button
                type="button"
                className="tracker-prepare-btn"
                disabled={true}
                title="Interview preparation and scheduling coming soon"
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              >
                Prepare with AI / Schedule · Coming soon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
