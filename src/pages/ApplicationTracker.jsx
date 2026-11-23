import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppNav from '../components/nav/AppNav';
import { getApplications } from '../api/applications';
import { useAuth } from '../auth';
import './ApplicationTracker.css';

export default function ApplicationTracker() {
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  // Load real applications and populate pipeline columns
  useEffect(() => {
    let isMounted = true;
    getApplications({}, token)
      .then((res) => {
        if (!isMounted) return;
        setApplications(res?.applications || []);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setApplications([]);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Merge real applications with job reference metadata matching Figma design
  // Pipeline Stages:
  // 1. Saved / Top 10 matches
  // 2. Applied
  // 3. Responded
  // 4. Interviewed
  // 5. Offered

  // Match real applications or default sample cards directly from Figma layout
  const savedMatches = [
    {
      id: 'saved-1',
      title: 'Product Designer',
      company: 'Northstar Labs',
      companyInitial: 'N',
      location: 'Budapest · Hybrid',
      fit: 94,
      isTopMatch: true,
      hasBookmark: false,
      stage: 'saved',
      submittedCV: 'Alex Morgan · Product Designer',
      highlightLines: [
        'Owned the shared design system used by four product squads',
        'Ran research sessions with 30+ users to shape the onboarding flow',
      ],
      coverLetter:
        'Dear Northstar Labs team, I am excited to apply for the Product Designer role...',
      postedRange: 'HUF 950k–1.3M / month',
      myExpectation: 'HUF 1.2M / month',
      offerReceived: '—',
    },
    {
      id: 'saved-2',
      title: 'UX Designer',
      company: 'Kinfolk',
      companyInitial: 'K',
      location: 'Budapest · Hybrid',
      fit: 87,
      isTopMatch: false,
      hasBookmark: true,
      stage: 'saved',
      submittedCV: 'Alex Morgan · UX Designer',
      highlightLines: ['Direct alignment with qualitative user research process'],
      coverLetter: 'Dear Kinfolk team...',
      postedRange: 'HUF 850k–1.1M / month',
      myExpectation: 'HUF 1.0M / month',
      offerReceived: '—',
    },
  ];

  // Applied cards (using real submissions if present, plus Figma pipeline items)
  const appliedItems =
    applications.length > 0
      ? applications.map((app, idx) => ({
          id: app.id || `app-${idx}`,
          title: app.job?.title || 'Product Designer',
          company: app.job?.company || 'Forma Systems',
          companyInitial: (app.job?.company?.[0] || 'F').toUpperCase(),
          location: app.job?.location
            ? `${app.job.location} · Hybrid`
            : 'Budapest · Hybrid',
          appliedAgo: 'Applied recently',
          fit: 84,
          stage: 'applied',
          method: app.method || 'manual',
          submittedCV: 'Candidate Profile · Tailored Version',
          highlightLines: [
            'Prioritized matching experience and demonstrated competencies',
          ],
          coverLetter: 'Tailored application submitted via Matchwise.',
          postedRange: 'HUF 900k–1.2M / month',
          myExpectation: 'HUF 1.1M / month',
          offerReceived: '—',
        }))
      : [
          {
            id: 'app-1',
            title: 'Product Designer',
            company: 'Forma Systems',
            companyInitial: 'F',
            location: 'Budapest · Hybrid',
            appliedAgo: 'Applied 3 days ago',
            fit: 84,
            stage: 'applied',
            method: 'manual',
            submittedCV: 'Alex Morgan · Product Designer tailored for Forma',
            highlightLines: [
              'Owned component libraries and scalable design frameworks',
            ],
            coverLetter: 'Dear Forma Systems team...',
            postedRange: 'HUF 900k–1.2M / month',
            myExpectation: 'HUF 1.1M / month',
            offerReceived: '—',
          },
          {
            id: 'app-2',
            title: 'UX Researcher',
            company: 'Mosaic',
            companyInitial: 'M',
            location: 'Budapest · Hybrid',
            appliedAgo: 'Applied 5 days ago',
            fit: 81,
            stage: 'applied',
            method: 'manual',
            submittedCV: 'Alex Morgan · UX Researcher tailored for Mosaic',
            highlightLines: [
              'Conducted extensive user interviews and usability benchmarking',
            ],
            coverLetter: 'Dear Mosaic team...',
            postedRange: 'HUF 800k–1.0M / month',
            myExpectation: 'HUF 950k / month',
            offerReceived: '—',
          },
        ];

  const respondedItems = [
    {
      id: 'resp-1',
      title: 'UX Designer',
      company: 'Studio One',
      companyInitial: 'S',
      location: 'Budapest · Hybrid',
      appliedAgo: 'Applied 8 days ago',
      fit: 88,
      stage: 'responded',
      actionLabel: 'View recruiter note',
      actionType: 'recruiter',
      submittedCV: 'Alex Morgan · UX Designer tailored for Studio One',
      highlightLines: ['Proven design systems leadership in high-paced sprint cadence'],
      coverLetter: 'Dear Studio One team...',
      postedRange: 'HUF 900k–1.2M / month',
      myExpectation: 'HUF 1.15M / month',
      offerReceived: '—',
    },
  ];

  const interviewedItems = [
    {
      id: 'int-1',
      title: 'Product Designer',
      company: 'Orbit',
      companyInitial: 'O',
      location: 'Budapest · Hybrid',
      appliedAgo: 'Applied 12 days ago',
      fit: 91,
      stage: 'interviewed',
      actionLabel: 'Prepare with AI / Schedule',
      actionType: 'schedule',
      statusTimeline: [
        { label: 'Applied', date: 'Sep 12', done: true },
        { label: 'Responded', date: 'Sep 14', done: true },
        { label: 'Interview', date: 'Sep 18', current: true, badge: 'Upcoming' },
      ],
      submittedCV: 'Alex Morgan · Product Designer tailored for Orbit',
      highlightLines: [
        'Owned the shared design system used by four product squads',
        'Ran research sessions with 30+ users to shape the onboarding flow',
      ],
      coverLetter:
        "Dear Orbit hiring team, I'm excited to apply for the Product Designer role. Over five years at Acme Studio I have led UX for onboarding flows and maintained a design system used by four product squads, which maps directly to the...",
      notes:
        'Prepare a 10-minute portfolio walkthrough and ask about the design team structure.',
      postedRange: 'HUF 900k–1.2M / month',
      myExpectation: 'HUF 1.1M / month',
      offerReceived: '—',
    },
  ];

  const offeredItems = [
    {
      id: 'off-1',
      title: 'Product Designer',
      company: 'Lumen Health',
      companyInitial: 'L',
      location: 'Budapest · Hybrid',
      appliedAgo: 'Applied 21 days ago',
      fit: 89,
      stage: 'offered',
      actionLabel: 'Review offer package',
      actionType: 'offer',
      submittedCV: 'Alex Morgan · Product Designer tailored for Lumen',
      highlightLines: ['Healthcare compliance and responsive mobile experiences'],
      coverLetter: 'Dear Lumen Health team...',
      postedRange: 'HUF 1.0M–1.4M / month',
      myExpectation: 'HUF 1.25M / month',
      offerReceived: 'HUF 1.2M / month + bonus',
    },
  ];

  const totalActive =
    savedMatches.length +
    appliedItems.length +
    respondedItems.length +
    interviewedItems.length +
    offeredItems.length;

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

        {/* 3 Metrics Cards */}
        <div className="tracker-metrics-row">
          <div className="tracker-metric-card">
            <div className="tracker-metric-label">ACTIVE APPLICATIONS</div>
            <div className="tracker-metric-val">{totalActive}</div>
          </div>
          <div className="tracker-metric-card">
            <div className="tracker-metric-label">RESPONSE RATE</div>
            <div className="tracker-metric-val">68%</div>
          </div>
          <div className="tracker-metric-card">
            <div className="tracker-metric-label">UPCOMING INTERVIEWS</div>
            <div className="tracker-metric-val-wrap">
              <span className="tracker-metric-val">2</span>
              <span className="tracker-metric-badge">Action required</span>
            </div>
          </div>
        </div>

        {/* 5 Column Kanban Pipeline */}
        <div className="tracker-board">
          {/* Column 1: Saved / Top 10 matches */}
          <div className="tracker-column">
            <div className="tracker-col-header">
              <span className="tracker-col-title">Saved / Top 10 matches</span>
              <span className="tracker-col-count">{savedMatches.length}</span>
            </div>
            <div className="tracker-cards-list">
              {savedMatches.map((item) => (
                <div
                  key={item.id}
                  className={`tracker-card ${selectedItem?.id === item.id ? 'is-selected' : ''}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="tracker-card-top">
                    <div className="tracker-card-brand">
                      <div className="tracker-company-logo">{item.companyInitial}</div>
                      <div>
                        <h3 className="tracker-card-role">{item.title}</h3>
                      </div>
                    </div>
                    {item.isTopMatch && (
                      <span className="tracker-top-match-badge">Top match</span>
                    )}
                    {item.hasBookmark && (
                      <span style={{ fontSize: '14px', color: '#15241d' }}>🔖</span>
                    )}
                  </div>
                  <div className="tracker-card-company">{item.company}</div>
                  <div className="tracker-card-meta">{item.location}</div>
                  <div className="tracker-card-bottom">
                    <span className="tracker-fit-pill">{item.fit}% fit</span>
                    <span className="tracker-card-dots">•••</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Applied */}
          <div className="tracker-column">
            <div className="tracker-col-header">
              <span className="tracker-col-title">Applied</span>
              <span className="tracker-col-count">{appliedItems.length}</span>
            </div>
            <div className="tracker-cards-list">
              {appliedItems.map((item) => (
                <div
                  key={item.id}
                  className={`tracker-card ${selectedItem?.id === item.id ? 'is-selected' : ''}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="tracker-card-top">
                    <div className="tracker-card-brand">
                      <div className="tracker-company-logo">{item.companyInitial}</div>
                      <h3 className="tracker-card-role">{item.title}</h3>
                    </div>
                  </div>
                  <div className="tracker-card-company">{item.company}</div>
                  <div className="tracker-card-meta">
                    {item.location} · {item.appliedAgo}
                  </div>
                  <div className="tracker-card-bottom">
                    <span className="tracker-fit-pill">{item.fit}% fit</span>
                    <span className="tracker-card-dots">•••</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Responded */}
          <div className="tracker-column">
            <div className="tracker-col-header">
              <span className="tracker-col-title">Responded</span>
              <span className="tracker-col-count">{respondedItems.length}</span>
            </div>
            <div className="tracker-cards-list">
              {respondedItems.map((item) => (
                <div
                  key={item.id}
                  className={`tracker-card ${selectedItem?.id === item.id ? 'is-selected' : ''}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="tracker-card-top">
                    <div className="tracker-card-brand">
                      <div className="tracker-company-logo">{item.companyInitial}</div>
                      <h3 className="tracker-card-role">{item.title}</h3>
                    </div>
                  </div>
                  <div className="tracker-card-company">{item.company}</div>
                  <div className="tracker-card-meta">
                    {item.location} · {item.appliedAgo}
                  </div>
                  <div className="tracker-card-bottom">
                    <span className="tracker-fit-pill">{item.fit}% fit</span>
                  </div>
                  {item.actionLabel && (
                    <button
                      type="button"
                      className="tracker-card-action-btn tracker-btn-recruiter"
                    >
                      {item.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Column 4: Interviewed */}
          <div className="tracker-column">
            <div className="tracker-col-header">
              <span className="tracker-col-title">Interviewed</span>
              <span className="tracker-col-count">{interviewedItems.length}</span>
            </div>
            <div className="tracker-cards-list">
              {interviewedItems.map((item) => (
                <div
                  key={item.id}
                  className={`tracker-card ${selectedItem?.id === item.id ? 'is-selected' : ''}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="tracker-card-top">
                    <div className="tracker-card-brand">
                      <div className="tracker-company-logo">{item.companyInitial}</div>
                      <h3 className="tracker-card-role">{item.title}</h3>
                    </div>
                  </div>
                  <div className="tracker-card-company">{item.company}</div>
                  <div className="tracker-card-meta">
                    {item.location} · {item.appliedAgo}
                  </div>
                  <div className="tracker-card-bottom">
                    <span className="tracker-fit-pill">{item.fit}% fit</span>
                  </div>
                  {item.actionLabel && (
                    <button
                      type="button"
                      className="tracker-card-action-btn tracker-btn-schedule"
                    >
                      {item.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Column 5: Offered */}
          <div className="tracker-column">
            <div className="tracker-col-header">
              <span className="tracker-col-title">Offered</span>
              <span className="tracker-col-count">{offeredItems.length}</span>
            </div>
            <div className="tracker-cards-list">
              {offeredItems.map((item) => (
                <div
                  key={item.id}
                  className={`tracker-card ${selectedItem?.id === item.id ? 'is-selected' : ''}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="tracker-card-top">
                    <div className="tracker-card-brand">
                      <div className="tracker-company-logo">{item.companyInitial}</div>
                      <h3 className="tracker-card-role">{item.title}</h3>
                    </div>
                  </div>
                  <div className="tracker-card-company">{item.company}</div>
                  <div className="tracker-card-meta">
                    {item.location} · {item.appliedAgo}
                  </div>
                  <div className="tracker-card-bottom">
                    <span className="tracker-fit-pill">{item.fit}% fit</span>
                  </div>
                  {item.actionLabel && (
                    <button
                      type="button"
                      className="tracker-card-action-btn tracker-btn-offer"
                    >
                      {item.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Side Drawer: Application Detail (Figma Screen 2) */}
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
                  {selectedItem.companyInitial || 'O'}
                </div>
                <div className="tracker-drawer-title-group">
                  <h2>{selectedItem.title}</h2>
                  <div className="tracker-drawer-meta">
                    {selectedItem.company} · {selectedItem.location}
                  </div>
                  <div className="tracker-drawer-badges">
                    <span className="tracker-drawer-badge badge-status">
                      {selectedItem.stage.charAt(0).toUpperCase() +
                        selectedItem.stage.slice(1)}
                    </span>
                    <span className="tracker-drawer-badge badge-fit">
                      {selectedItem.fit}% fit
                    </span>
                    <span className="tracker-drawer-badge badge-tailored">
                      Applied with tailored AI CV
                    </span>
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
                  <div className="tracker-timeline-item">
                    <div className="tracker-timeline-left">
                      <span className="timeline-dot" />
                      <span className="timeline-label">Applied</span>
                    </div>
                    <span className="timeline-date">Sep 12</span>
                  </div>
                  <div className="tracker-timeline-item">
                    <div className="tracker-timeline-left">
                      <span className="timeline-dot" />
                      <span className="timeline-label">Responded</span>
                    </div>
                    <span className="timeline-date">Sep 14</span>
                  </div>
                  <div className="tracker-timeline-item">
                    <div className="tracker-timeline-left">
                      <span className="timeline-dot is-current" />
                      <span className="timeline-label">Interview</span>
                      <span className="timeline-upcoming-pill">Upcoming</span>
                    </div>
                    <span className="timeline-date">Sep 18</span>
                  </div>
                </div>
              </div>

              {/* Submitted Resume Version */}
              <div className="tracker-drawer-section">
                <div className="tracker-section-head">
                  <h4 className="tracker-section-title">Submitted resume version</h4>
                  <span className="tracker-link-action">Open full CV ↗</span>
                </div>
                <div className="tracker-resume-box">
                  <div className="tracker-resume-candidate">Alex Morgan</div>
                  <div className="tracker-resume-sub">
                    Product Designer · tailored for {selectedItem.company}
                  </div>
                  {selectedItem.highlightLines?.map((line, idx) => (
                    <div key={idx} className="tracker-resume-highlight">
                      {line}
                    </div>
                  ))}
                  <p className="tracker-resume-legend">
                    <span style={{ color: '#027a48' }}>■</span> Highlighted lines
                    are AI-tailored adjustments for this role
                  </p>
                </div>
              </div>

              {/* Generated Cover Letter */}
              <div className="tracker-drawer-section">
                <div className="tracker-section-head">
                  <h4 className="tracker-section-title">Generated cover letter</h4>
                  <span className="tracker-link-action">Read full letter ↗</span>
                </div>
                <div className="tracker-cover-letter-box">
                  {selectedItem.coverLetter}
                </div>
              </div>

              {/* Personal Notes */}
              <div className="tracker-drawer-section">
                <div className="tracker-section-head">
                  <h4 className="tracker-section-title">Personal notes</h4>
                  <span className="tracker-link-action">+ Add note</span>
                </div>
                <textarea
                  className="tracker-notes-textarea"
                  rows={3}
                  defaultValue={
                    selectedItem.notes ||
                    'Prepare a 10-minute portfolio walkthrough and ask about the design team structure.'
                  }
                />
              </div>

              {/* Salary Tracking */}
              <div className="tracker-drawer-section">
                <div className="tracker-section-head">
                  <h4 className="tracker-section-title">Salary tracking</h4>
                </div>
                <div className="tracker-salary-grid">
                  <div className="tracker-salary-field">
                    <label>Posted range</label>
                    <input
                      type="text"
                      className="tracker-salary-input"
                      defaultValue={selectedItem.postedRange || 'HUF 900k–1.2M / month'}
                      readOnly
                    />
                  </div>
                  <div className="tracker-salary-field">
                    <label>My expectation</label>
                    <input
                      type="text"
                      className="tracker-salary-input"
                      defaultValue={selectedItem.myExpectation || 'HUF 1.1M / month'}
                    />
                  </div>
                  <div className="tracker-salary-field">
                    <label>Offer received</label>
                    <input
                      type="text"
                      className="tracker-salary-input"
                      defaultValue={selectedItem.offerReceived || '—'}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="tracker-drawer-footer">
              <button
                type="button"
                className="tracker-withdraw-btn"
                onClick={() => {
                  if (confirm('Are you sure you want to withdraw this application?')) {
                    setSelectedItem(null);
                  }
                }}
              >
                Withdraw application
              </button>
              <button
                type="button"
                className="tracker-prepare-btn"
                onClick={() => alert('Opening interview preparation assistant...')}
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
