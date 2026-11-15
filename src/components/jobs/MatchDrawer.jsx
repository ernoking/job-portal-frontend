import { useEffect, useRef } from 'react';
import './MatchDrawer.css';

export default function MatchDrawer({
  job,
  isOpen,
  isLoading,
  error,
  onClose,
  onRetry,
}) {
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);

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
      // Restore focus to triggering element if available
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
    title = '',
    company = '',
    location = '',
    workType = '',
    fit,
    whyMatch = [],
    whyMatchDetail = [],
    aboutRole = '',
    skillsToBuild = [],
  } = job || {};

  const hasScore = typeof fit === 'number' && !Number.isNaN(fit);
  const effectiveWhyMatch = (whyMatchDetail && whyMatchDetail.length > 0)
    ? whyMatchDetail
    : whyMatch;
  const hasWhyMatch = Array.isArray(effectiveWhyMatch) && effectiveWhyMatch.length > 0;
  const hasAboutRole = Boolean(aboutRole && aboutRole.trim());
  const hasSkillsToBuild = Array.isArray(skillsToBuild) && skillsToBuild.length > 0;

  const metaString = [company, location, workType].filter(Boolean).join(' · ');

  // Narrative intro vs bullet points
  const introNarrative = hasWhyMatch ? effectiveWhyMatch[0] : null;
  const bulletDetails = (hasWhyMatch && effectiveWhyMatch.length > 1)
    ? effectiveWhyMatch.slice(1)
    : [];

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
        {/* Close button */}
        <button
          ref={closeButtonRef}
          type="button"
          className="match-drawer-close"
          onClick={onClose}
          aria-label="Close drawer"
          data-testid="match-drawer-close-btn"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 1L13 13M1 13L13 1"
              stroke="#10261B"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Drawer content */}
        <div className="match-drawer-content">
          {isLoading ? (
            /* Loading State */
            <div className="match-drawer-loading" data-testid="match-drawer-loading">
              <div className="match-drawer-skeleton-bar" style={{ width: '30%', height: 16 }} />
              <div className="match-drawer-skeleton-bar" style={{ width: '70%', height: 36 }} />
              <div className="match-drawer-skeleton-bar" style={{ width: '50%', height: 18 }} />
              <div className="match-drawer-skeleton-bar" style={{ width: '100%', height: 140, marginTop: 24 }} />
            </div>
          ) : error ? (
            /* Error State */
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
              {/* Eyebrow - rendered only if fit score exists */}
              {hasScore && (
                <div className="match-drawer-eyebrow">{fit}% MATCH</div>
              )}

              {/* Role Title */}
              <h2 id="drawer-role-title" className="match-drawer-title">
                {title}
              </h2>

              {/* Meta */}
              {metaString && (
                <p className="match-drawer-meta">{metaString}</p>
              )}

              {/* Section 1: Why you're a strong match - omitted if no whyMatch */}
              {hasWhyMatch && (
                <>
                  <hr className="match-drawer-divider" />
                  <section className="match-drawer-section">
                    <h3 className="match-drawer-heading">Why you’re a strong match</h3>
                    {introNarrative && (
                      <p className="match-drawer-narrative">{introNarrative}</p>
                    )}
                    {bulletDetails.length > 0 && (
                      <ul className="match-drawer-bullets">
                        {bulletDetails.map((point, idx) => (
                          <li key={idx} className="match-drawer-bullet-item">
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              )}

              {/* Section 2: About the role - omitted if no description/aboutRole */}
              {hasAboutRole && (
                <>
                  <hr className="match-drawer-divider" />
                  <section className="match-drawer-section">
                    <h3 className="match-drawer-heading">About the role</h3>
                    <p className="match-drawer-text">{aboutRole}</p>
                  </section>
                </>
              )}

              {/* Section 3: Skills to build - omitted if no skillsToBuild */}
              {hasSkillsToBuild && (
                <>
                  <hr className="match-drawer-divider" />
                  <section className="match-drawer-section">
                    <h3 className="match-drawer-heading">Skills to build</h3>
                    <div className="match-drawer-skills">
                      {skillsToBuild.map((skill, idx) => (
                        <span key={idx} className="match-drawer-skill-chip">
                          {skill} +
                        </span>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* CRITICAL NOTE: NO APPLY BUTTON HERE PER SPEC */}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
