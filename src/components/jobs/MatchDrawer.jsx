import { useEffect, useRef } from 'react';
import './MatchDrawer.css';

export default function MatchDrawer({
  job,
  isOpen,
  onClose,
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

  if (!isOpen || !job) return null;

  const {
    title,
    company,
    location,
    workType,
    fit = 94,
    whyMatchDetail = [],
    aboutRole = '',
    skillsToBuild = [],
  } = job;

  const metaString = [company, location, workType].filter(Boolean).join(' · ');

  // Narrative intro vs bullet points
  const introNarrative = whyMatchDetail.length > 0 ? whyMatchDetail[0] : null;
  const bulletDetails = whyMatchDetail.length > 1 ? whyMatchDetail.slice(1) : [];

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
          {/* Eyebrow */}
          <div className="match-drawer-eyebrow">{fit}% MATCH</div>

          {/* Role Title */}
          <h2 id="drawer-role-title" className="match-drawer-title">
            {title}
          </h2>

          {/* Meta */}
          <p className="match-drawer-meta">{metaString}</p>

          <hr className="match-drawer-divider" />

          {/* Section 1: Why you're a strong match */}
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

          <hr className="match-drawer-divider" />

          {/* Section 2: About the role */}
          <section className="match-drawer-section">
            <h3 className="match-drawer-heading">About the role</h3>
            <p className="match-drawer-text">{aboutRole}</p>
          </section>

          <hr className="match-drawer-divider" />

          {/* Section 3: Skills to build */}
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

          {/* CRITICAL NOTE: NO APPLY BUTTON HERE PER SPEC */}
        </div>
      </div>
    </div>
  );
}
