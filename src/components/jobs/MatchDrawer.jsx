import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScoreRing from '../ScoreRing';
import { isJobSaved, toggleSaveJob } from '../../api/savedJobs';
import './MatchDrawer.css';

export default function MatchDrawer({
  job,
  isOpen,
  isLoading,
  error,
  onClose,
  onRetry,
  onApply,
}) {
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(() => (job?.id ? isJobSaved(job.id) : false));

  const [lastJobId, setLastJobId] = useState(job?.id);
  if (job?.id !== lastJobId) {
    setLastJobId(job?.id);
    setIsSaved(job?.id ? isJobSaved(job.id) : false);
  }

  // Lock body scroll and focus close button when drawer opens
  useEffect(() => {
    if (!isOpen) return;

    const previousFocusedElement = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus close button on mount
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      if (previousFocusedElement && typeof previousFocusedElement.focus === 'function') {
        previousFocusedElement.focus();
      }
    };
  }, [isOpen]);

  // Handle Escape key and focus trap
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const {
    id = '',
    title = '',
    company = '',
    location = '',
    workType = '',
    employmentType = '',
    fit = 94,
  } = job || {};

  const hasScore = typeof fit === 'number' && !Number.isNaN(fit);
  const metaString = [company, location, workType, employmentType].filter(Boolean).join(' · ');

  const handleApplyClick = () => {
    onClose();
    if (onApply) {
      onApply(job);
    } else {
      navigate(`/jobs/${id || 'job-1'}/apply`);
    }
  };

  return (
    <div
      className="match-drawer-overlay"
      onClick={onClose}
      data-testid="match-drawer-overlay"
      role="presentation"
    >
      <div
        ref={drawerRef}
        className="match-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-role-title"
        onClick={(e) => e.stopPropagation()}
        data-testid="match-drawer-panel"
      >
        {/* Top Action Bar matching Figma Screen 9 */}
        <div className="match-drawer-top-bar">
          <button
            ref={closeButtonRef}
            type="button"
            className="match-drawer-close-circle"
            onClick={onClose}
            aria-label="Close drawer"
            data-testid="match-drawer-close-btn"
          >
            ✕
          </button>

          <div className="match-drawer-top-info">
            <h2 id="drawer-role-title" className="match-drawer-header-title">
              {title}
            </h2>
            <p className="match-drawer-header-sub">{metaString}</p>
          </div>

          <div className="match-drawer-top-actions">
            {hasScore && (
              <div className="drawer-fit-ring-badge">
                <ScoreRing score={fit} size={44} strokeWidth={4} />
              </div>
            )}
            <button
              type="button"
              className="drawer-header-apply-btn"
              onClick={handleApplyClick}
            >
              Apply now →
            </button>
            <button
              type="button"
              className={`drawer-bookmark-btn ${isSaved ? 'is-saved' : ''}`}
              onClick={() => {
                if (job) {
                  const nowSaved = toggleSaveJob(job);
                  setIsSaved(nowSaved);
                }
              }}
              aria-label="Save job for later"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? '#10261B' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="match-drawer-content">
          {isLoading ? (
            <div className="match-drawer-loading" data-testid="match-drawer-loading">
              <div className="match-drawer-skeleton-bar" style={{ width: '40%', height: 20 }} />
              <div className="match-drawer-skeleton-bar" style={{ width: '80%', height: 36 }} />
              <div className="match-drawer-skeleton-bar" style={{ width: '100%', height: 160 }} />
            </div>
          ) : error ? (
            <div className="match-drawer-error" data-testid="match-drawer-error">
              <p className="match-drawer-error-text">{error}</p>
              {onRetry && (
                <button
                  type="button"
                  className="match-drawer-retry-btn"
                  onClick={onRetry}
                  data-testid="match-drawer-retry-btn"
                >
                  Try again
                </button>
              )}
            </div>
          ) : job ? (
            <>
              {/* 1. Why you match */}
              <section className="drawer-detail-section">
                <h3 className="drawer-detail-heading">Why you match</h3>
                <p className="drawer-detail-text">
                  Your hands-on Figma experience and research-led process map directly to the team’s core product workflow.
                </p>
                <ul className="drawer-bullet-list">
                  <li>Design systems: your component-library work at Acme Studio maps to the team’s design system ownership.</li>
                  <li>Prototyping: your Figma prototypes cover the discovery-to-delivery workflow described in the role.</li>
                  <li>Collaboration: your day-to-day work with engineers matches the cross-functional squad setup.</li>
                </ul>
              </section>

              {/* 2. Transferable skills */}
              <section className="drawer-detail-section">
                <h3 className="drawer-detail-heading">Transferable skills</h3>
                <p className="drawer-detail-text">
                  Your client-facing work and visual design background translate directly to product design: stakeholder communication, fast iteration and presenting design rationale.
                </p>
              </section>

              {/* 3. Skills to build */}
              <section className="drawer-detail-section">
                <h3 className="drawer-detail-heading">Skills to build</h3>
                <div className="drawer-skills-group">
                  <span className="skills-sub-tag">CRITICAL REQUIREMENTS</span>
                  <div className="skill-chip-row">
                    <span className="skill-badge-item">Motion design</span>
                    <span className="skill-boost-badge">Boosts your match score by +12%</span>
                  </div>
                </div>

                <div className="drawer-skills-group" style={{ marginTop: 14 }}>
                  <span className="skills-sub-tag">NICE TO HAVE</span>
                  <div className="skill-chip-row">
                    <span className="skill-badge-item">Product analytics</span>
                    <span className="skill-boost-badge">Boosts your match score by +8%</span>
                  </div>
                </div>
              </section>

              {/* 4. About the role and team */}
              <section className="drawer-detail-section">
                <h3 className="drawer-detail-heading">About the role and team</h3>
                <p className="drawer-detail-text">
                  Join a small product team building thoughtful tools for modern workplaces. You’ll own features from discovery through polished delivery.
                </p>
              </section>

              {/* 5. Key responsibilities */}
              <section className="drawer-detail-section">
                <h3 className="drawer-detail-heading">Key responsibilities</h3>
                <ul className="drawer-bullet-list">
                  <li>Own features end to end, from discovery research to polished delivery</li>
                  <li>Design and maintain components in the shared design system</li>
                  <li>Prototype flows and test them with real users</li>
                  <li>Work with engineers to ship and iterate on live features</li>
                </ul>
              </section>

              {/* 6. Requirements and qualifications */}
              <section className="drawer-detail-section">
                <h3 className="drawer-detail-heading">Requirements and qualifications</h3>
                <ul className="drawer-bullet-list">
                  <li>1–3 years of product or UX design experience</li>
                  <li>Strong Figma and prototyping skills</li>
                  <li>Experience with user research and usability testing</li>
                  <li>Clear communication in English; Hungarian is a plus</li>
                </ul>
              </section>

              {/* 7. Benefits and compensation */}
              <section className="drawer-detail-section" style={{ paddingBottom: 60 }}>
                <h3 className="drawer-detail-heading">Benefits and compensation</h3>
                <ul className="drawer-bullet-list">
                  <li>Salary band: HUF 900K – 1.2M gross per month</li>
                  <li>Hybrid: 3 days per week in the Budapest office</li>
                  <li>Private health insurance and a wellness budget</li>
                  <li>Laptop plus a learning and equipment allowance</li>
                </ul>
              </section>
            </>
          ) : null}
        </div>

        {/* Bottom Floating Bar */}
        <div className="match-drawer-bottom-bar">
          <button
            type="button"
            className="drawer-save-later-btn"
            onClick={() => {
              if (job) {
                const nowSaved = toggleSaveJob(job);
                setIsSaved(nowSaved);
              }
            }}
          >
            {isSaved ? 'Saved in tracker' : 'Save for later'}
          </button>
          <button
            type="button"
            className="drawer-primary-apply-btn"
            onClick={handleApplyClick}
          >
            Apply now →
          </button>
        </div>
      </div>
    </div>
  );
}
