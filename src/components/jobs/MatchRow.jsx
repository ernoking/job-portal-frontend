import React from 'react';
import { isJobSaved, toggleSaveJob } from '../../api/savedJobs';
import './MatchRow.css';

export default function MatchRow({
  job,
  onSelect,
  onApply,
  isApplied = false,
  isExpanded = false,
  onToggleExpand,
}) {
  const [saved, setSaved] = React.useState(() => (job?.id ? isJobSaved(job.id) : false));
  const [lastJobId, setLastJobId] = React.useState(job?.id);

  if (job?.id !== lastJobId) {
    setLastJobId(job?.id);
    setSaved(job?.id ? isJobSaved(job.id) : false);
  }

  if (!job) return null;

  const {
    id,
    title,
    company,
    location,
    workType,
    employmentType = '',
    fit,
    whyMatch = ['Figma & prototyping', 'User research', 'Design systems'],
    skillsToBuild = ['Accessibility (WCAG)', 'Product analytics'],
  } = job;

  const metaString = [location, workType, employmentType]
    .filter(Boolean)
    .join(' · ');

  const hasScore = typeof fit === 'number' && !Number.isNaN(fit);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onToggleExpand) {
        onToggleExpand();
      } else {
        onSelect(id);
      }
    }
  };

  const handleApplyClick = (e) => {
    e.stopPropagation();
    onApply?.(job);
  };

  return (
    <div
      className={`match-row-card ${isExpanded ? 'is-expanded' : ''}`}
      tabIndex={0}
      onClick={() => (onToggleExpand ? onToggleExpand() : onSelect(id))}
      onKeyDown={handleKeyDown}
      aria-label={`View match details for ${title} at ${company}${hasScore ? `, ${fit}% fit` : ''}`}
      data-testid={`match-row-${id}`}
    >
      <div className="match-row-top-line">
        <div className="match-row-left">
          <span className="match-row-company">{company}</span>
          <h3 className="match-row-title">{title}</h3>
          {metaString && <p className="match-row-meta">{metaString}</p>}
        </div>

        <div className="match-row-right">
          <button
            type="button"
            className="drawer-bookmark-btn"
            style={{ width: '32px', height: '32px', padding: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              const now = toggleSaveJob(job);
              setSaved(now);
            }}
            title={saved ? 'Remove from saved' : 'Save job'}
            aria-label={saved ? 'Remove from saved' : 'Save job'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? '#10261B' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>

          {!isApplied && <span className="match-row-new-badge">New</span>}

          {isApplied ? (
            <span className="match-row-applied-badge">✓ Applied</span>
          ) : (
            <button
              type="button"
              className="match-row-apply-btn"
              onClick={handleApplyClick}
              aria-label={`Apply to ${title} at ${company}`}
            >
              Apply now
            </button>
          )}

          {hasScore && (
            <span className="match-row-fit">{fit}% fit</span>
          )}
        </div>
      </div>

      {/* Expanded Accordion Body (Figma Screen 2) */}
      {isExpanded && (
        <div className="match-row-expanded-body" onClick={(e) => e.stopPropagation()}>
          <div className="match-row-panels-grid">
            <div className="match-row-panel">
              <span className="row-panel-heading">Why you match</span>
              <ul className="row-panel-list">
                {whyMatch.map((w, idx) => (
                  <li key={idx} className="row-panel-item">
                    <span className="row-check">✓</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="match-row-panel">
              <span className="row-panel-heading">Skills to build</span>
              <ul className="row-panel-list">
                {skillsToBuild.map((s, idx) => (
                  <li key={idx} className="row-panel-item">
                    <span className="row-plus">+</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="match-row-bottom-actions">
            <button
              type="button"
              className="match-row-view-details-link"
              onClick={() => onSelect(id)}
            >
              View all details →
            </button>

            {!isApplied && (
              <button
                type="button"
                className="match-row-apply-btn-large"
                onClick={handleApplyClick}
              >
                Apply now
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
