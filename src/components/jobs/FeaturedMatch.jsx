import ScoreRing from '../ScoreRing';
import './FeaturedMatch.css';

export default function FeaturedMatch({
  job,
  onViewDetails,
  onApply,
  isApplied = false,
}) {
  if (!job) return null;

  const {
    id,
    title,
    company,
    companyInitial = company?.[0]?.toUpperCase() || '',
    location,
    workType,
    employmentType = '',
    fit,
    whyMatch = [],
    skillsToBuild = [],
  } = job;

  const metaString = [location, workType, employmentType]
    .filter(Boolean)
    .join(' · ');

  const hasScore = typeof fit === 'number' && !Number.isNaN(fit);
  const hasWhyMatch = Array.isArray(whyMatch) && whyMatch.length > 0;
  const hasSkillsToBuild = Array.isArray(skillsToBuild) && skillsToBuild.length > 0;
  const hasPanels = hasWhyMatch || hasSkillsToBuild;

  return (
    <article
      className="featured-match-card"
      aria-label={`Featured match: ${title} at ${company}${hasScore ? `, ${fit}% match` : ''}`}
      data-testid="featured-match-card"
    >
      {/* 61px top gap positioning for eyebrow */}
      <div className="featured-eyebrow">YOUR TOP MATCH</div>

      {/* Main Identity Row */}
      <div className="featured-identity-row">
        <div className="featured-company-info">
          {companyInitial && (
            <div className="featured-logo-tile" aria-hidden="true">
              {companyInitial}
            </div>
          )}
          <div className="featured-titles">
            <span className="featured-company-name">{company}</span>
            <h2 className="featured-role-title">{title}</h2>
            {metaString && <p className="featured-meta">{metaString}</p>}
          </div>
        </div>

        {/* Circular fit gauge - rendered only if fit score is present */}
        {hasScore && (
          <div className="featured-fit-gauge" data-testid="featured-fit-gauge">
            <ScoreRing score={fit} size={70} strokeWidth={5} />
          </div>
        )}
      </div>

      {/* Highlight Panels Row - rendered only if panels exist */}
      {hasPanels && (
        <div className="featured-panels-row">
          {/* Why you match */}
          {hasWhyMatch && (
            <div className="featured-panel">
              <h3 className="featured-panel-title">Why you match</h3>
              <ul className="featured-panel-list">
                {whyMatch.map((item, idx) => (
                  <li key={idx} className="featured-panel-item why-match-item">
                    <span className="panel-item-icon check-icon" aria-hidden="true">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills to build */}
          {hasSkillsToBuild && (
            <div className="featured-panel">
              <h3 className="featured-panel-title">Skills to build</h3>
              <ul className="featured-panel-list">
                {skillsToBuild.map((item, idx) => (
                  <li key={idx} className="featured-panel-item skills-item">
                    <span className="panel-item-icon plus-icon" aria-hidden="true">
                      +
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer Row */}
      <div className="featured-footer-row">
        <button
          type="button"
          className="featured-view-link"
          onClick={() => onViewDetails(id)}
          data-testid="featured-view-full-match"
        >
          View full match →
        </button>

        {isApplied ? (
          <span className="featured-applied-badge" data-testid="featured-applied-badge">
            ✓ Applied
          </span>
        ) : (
          <button
            type="button"
            className="featured-apply-btn"
            onClick={() => onApply?.(job)}
            data-testid="featured-apply-btn"
          >
            Apply now
          </button>
        )}
      </div>
    </article>
  );
}
