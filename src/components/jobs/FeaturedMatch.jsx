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

  return (
    <article
      className="featured-match-card"
      aria-label={`Featured match: ${title} at ${company}${hasScore ? `, ${fit}% match` : ''}`}
      data-testid="featured-match-card"
    >
      {/* 61px top gap positioning for eyebrow */}
      <div className="featured-top-bar">
        <span className="featured-eyebrow">YOUR TOP MATCH</span>
        {isApplied && (
          <span className="featured-top-applied-badge">✓ Applied</span>
        )}
      </div>

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

      {/* Highlight Panels Row - rendered only if panels exist, or honest empty state */}
      <div className="featured-panels-row">
        {/* Why you match */}
        <div className="featured-panel">
          <div className="panel-head-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 className="featured-panel-title" style={{ margin: 0 }}>Why you match</h3>
            {!hasWhyMatch && (
              <span className="filter-coming-soon-badge" style={{ fontSize: '10px' }}>CV profile required</span>
            )}
          </div>
          {hasWhyMatch ? (
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
          ) : (
            <p style={{ fontSize: '12px', color: '#667085', margin: 0, lineHeight: 1.4 }}>
              Upload your CV to see your matching skills calculated by AI.
            </p>
          )}
        </div>

        {/* Skills to build */}
        <div className="featured-panel">
          <div className="panel-head-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 className="featured-panel-title" style={{ margin: 0 }}>Skills to build</h3>
            {!hasSkillsToBuild && (
              <span className="filter-coming-soon-badge" style={{ fontSize: '10px' }}>CV profile required</span>
            )}
          </div>
          {hasSkillsToBuild ? (
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
          ) : (
            <p style={{ fontSize: '12px', color: '#667085', margin: 0, lineHeight: 1.4 }}>
              Upload your CV to identify skill growth opportunities for this role.
            </p>
          )}
        </div>
      </div>

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
