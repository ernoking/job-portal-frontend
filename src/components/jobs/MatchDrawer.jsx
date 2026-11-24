import { useEffect, useRef, useState } from 'react';
import ScoreRing from '../ScoreRing';
import { isJobSaved, toggleSaveJob } from '../../api/savedJobs';
import { applyToJob } from '../../api/applications';
import { useAuth } from '../../auth';
import './MatchDrawer.css';

export default function MatchDrawer({
  job,
  isOpen,
  isLoading,
  error,
  onClose,
  onRetry,
  onApplySuccess,
}) {
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const { token } = useAuth();

  const [isSaved, setIsSaved] = useState(() => (job?.id ? isJobSaved(job.id) : false));
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [hasApplied, setHasApplied] = useState(() => Boolean(job?.application?.status === 'applied'));

  const [lastJobId, setLastJobId] = useState(job?.id);
  if (job?.id !== lastJobId) {
    setLastJobId(job?.id);
    setIsSaved(job?.id ? isJobSaved(job.id) : false);
    setIsApplying(false);
    setApplyError(null);
    setHasApplied(Boolean(job?.application?.status === 'applied'));
  }

  // Lock body scroll and focus close button when drawer opens
  useEffect(() => {
    if (!isOpen) return;

    const previousFocusedElement = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

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
    fit,
    whyMatch = [],
    transferableSkills = null,
    skillsToBuild = [],
    aboutRole = '',
    keyResponsibilities = null,
    requirementsQualifications = null,
    benefitsCompensation = null,
  } = job || {};

  const hasScore = typeof fit === 'number' && !Number.isNaN(fit);
  const metaString = [company, location, workType, employmentType].filter(Boolean).join(' · ');

  const handleApplyClick = async () => {
    if (isApplying || hasApplied) return;
    setIsApplying(true);
    setApplyError(null);

    try {
      await applyToJob(id, token);
      setHasApplied(true);
      if (onApplySuccess) onApplySuccess(job);
    } catch (err) {
      if (err?.data?.error?.code === 'ALREADY_APPLIED') {
        setHasApplied(true);
      } else {
        setApplyError(err?.message || 'Unable to submit application.');
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveClick = () => {
    if (job) {
      const nowSaved = toggleSaveJob(job);
      setIsSaved(nowSaved);
    }
  };

  return (
    <div
      className="match-drawer-backdrop"
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
        {/* Header: height 96px */}
        <div className="match-drawer-header">
          <button
            ref={closeButtonRef}
            type="button"
            className="match-drawer-close-btn"
            onClick={onClose}
            aria-label="Close drawer"
            data-testid="match-drawer-close-btn"
          >
            ×
          </button>

          <div className="match-drawer-title-block">
            <h2 id="drawer-role-title" className="match-drawer-title">
              {title}
            </h2>
            <p className="match-drawer-subtitle">{metaString}</p>
          </div>

          <div className="match-drawer-header-actions">
            {hasScore && (
              <div className="match-drawer-ring-wrapper">
                <ScoreRing score={fit} size={56} stroke={4} />
              </div>
            )}

            <button
              type="button"
              className={`match-drawer-apply-btn ${hasApplied ? 'is-applied' : ''}`}
              onClick={handleApplyClick}
              disabled={isApplying}
            >
              {isApplying ? 'Applying...' : hasApplied ? 'Applied ✓' : 'Apply now →'}
            </button>

            <button
              type="button"
              className={`match-drawer-bookmark-btn ${isSaved ? 'is-saved' : ''}`}
              onClick={handleSaveClick}
              aria-label="Save job for later"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? '#17301F' : 'none'} stroke="#17301F" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </div>
        </div>

        {applyError && (
          <div className="match-drawer-apply-error">{applyError}</div>
        )}

        {/* Scrollable Body */}
        <div className="match-drawer-body">
          {isLoading ? (
            <div className="match-drawer-loading" data-testid="match-drawer-loading">
              <div className="match-drawer-skeleton" style={{ width: '40%', height: 16 }} />
              <div className="match-drawer-skeleton" style={{ width: '90%', height: 12 }} />
              <div className="match-drawer-skeleton" style={{ width: '85%', height: 12 }} />
              <div className="match-drawer-skeleton" style={{ width: '100%', height: 60 }} />
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
              {/* Section 1: Why you match (four plain lines, no bullets, no bold) */}
              {Array.isArray(whyMatch) && whyMatch.length > 0 && (
                <section className="drawer-section">
                  <h3 className="drawer-heading">Why you match</h3>
                  <div className="drawer-plain-lines">
                    {whyMatch.map((line, idx) => (
                      <p key={idx} className="drawer-body-line">
                        {typeof line === 'string' ? line : line?.name || ''}
                      </p>
                    ))}
                  </div>
                </section>
              )}

              {/* Section 2: Transferable skills (one paragraph, plain text; hidden if missing) */}
              {transferableSkills && (
                <section className="drawer-section">
                  <h3 className="drawer-heading">Transferable skills</h3>
                  <p className="drawer-body-line">{transferableSkills}</p>
                </section>
              )}

              {/* Section 3: Skills to build */}
              {Array.isArray(skillsToBuild) && skillsToBuild.length > 0 && (
                <section className="drawer-section">
                  <h3 className="drawer-heading">Skills to build</h3>
                  {skillsToBuild.some((s) => s.category) ? (
                    <>
                      {skillsToBuild.filter((s) => s.category === 'critical').map((item, idx) => (
                        <div key={idx} className="drawer-skills-group">
                          <span className="drawer-group-label">CRITICAL REQUIREMENTS</span>
                          <div className="drawer-chip-row">
                            <span className="drawer-chip">{item.name}</span>
                            {item.impact && (
                              <span className="drawer-boost-text">Boosts your match score by {item.impact}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {skillsToBuild.filter((s) => s.category === 'nice_to_have').map((item, idx) => (
                        <div key={idx} className="drawer-skills-group" style={{ marginTop: 14 }}>
                          <span className="drawer-group-label">NICE TO HAVE</span>
                          <div className="drawer-chip-row">
                            <span className="drawer-chip">{item.name}</span>
                            {item.impact && (
                              <span className="drawer-boost-text">Boosts your match score by {item.impact}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="drawer-skills-group">
                      <div className="drawer-chip-row" style={{ flexWrap: 'wrap' }}>
                        {skillsToBuild.map((item, idx) => (
                          <span key={idx} className="drawer-chip">
                            {typeof item === 'string' ? item : item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Section 4: About the role and team */}
              {aboutRole && (
                <section className="drawer-section">
                  <h3 className="drawer-heading">About the role and team</h3>
                  <p className="drawer-body-line">{aboutRole}</p>
                </section>
              )}

              {/* Section 5: Key responsibilities (literal • bullet character) */}
              {Array.isArray(keyResponsibilities) && keyResponsibilities.length > 0 && (
                <section className="drawer-section">
                  <h3 className="drawer-heading">Key responsibilities</h3>
                  <div className="drawer-bullet-lines">
                    {keyResponsibilities.map((item, idx) => (
                      <p key={idx} className="drawer-bullet-line">
                        • {item}
                      </p>
                    ))}
                  </div>
                </section>
              )}

              {/* Section 6: Requirements and qualifications (literal • bullet character) */}
              {Array.isArray(requirementsQualifications) && requirementsQualifications.length > 0 && (
                <section className="drawer-section">
                  <h3 className="drawer-heading">Requirements and qualifications</h3>
                  <div className="drawer-bullet-lines">
                    {requirementsQualifications.map((item, idx) => (
                      <p key={idx} className="drawer-bullet-line">
                        • {item}
                      </p>
                    ))}
                  </div>
                </section>
              )}

              {/* Section 7: Benefits and compensation (literal • bullet character, no divider after) */}
              {Array.isArray(benefitsCompensation) && benefitsCompensation.length > 0 && (
                <section className="drawer-section is-last">
                  <h3 className="drawer-heading">Benefits and compensation</h3>
                  <div className="drawer-bullet-lines">
                    {benefitsCompensation.map((item, idx) => (
                      <p key={idx} className="drawer-bullet-line">
                        • {item}
                      </p>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : null}
        </div>

        {/* Footer: height 78px, 1px top border --line */}
        <div className="match-drawer-footer">
          <button
            type="button"
            className="drawer-footer-save-btn"
            onClick={handleSaveClick}
          >
            {isSaved ? 'Saved in tracker' : 'Save for later'}
          </button>

          <button
            type="button"
            className={`match-drawer-apply-btn ${hasApplied ? 'is-applied' : ''}`}
            onClick={handleApplyClick}
            disabled={isApplying}
          >
            {isApplying ? 'Applying...' : hasApplied ? 'Applied ✓' : 'Apply now →'}
          </button>
        </div>
      </div>
    </div>
  );
}
