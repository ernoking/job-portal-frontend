import ScoreRing from '../ScoreRing';
import './FeaturedMatch.css';

export default function FeaturedMatch({
  job,
  isApplied,
  onApply,
  onViewDetails,
}) {
  if (!job) return null;

  const {
    id,
    title,
    company,
    companyInitial = company?.[0] || 'N',
    location,
    workType,
    employmentType = 'Full-time',
    fit = 94,
    whyMatch = [],
    skillsToBuild = [],
  } = job;

  const metaString = [location, workType, employmentType]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="featured-match-card" aria-label={`Featured match: ${title} at ${company}`} data-testid="featured-match-card">
      {/* 61px top gap positioning for eyebrow */}
      <div className="featured-eyebrow">YOUR TOP MATCH</div>

      {/* Main Identity Row */}
      <div className="featured-identity-row">
        <div className="featured-company-info">
          <div className="featured-logo-tile" aria-hidden="true">
            {companyInitial}
          </div>
          <div className="featured-titles">
            <span className="featured-company-name">{company}</span>
            <h2 className="featured-role-title">{title}</h2>
            <p className="featured-meta">{metaString}</p>
          </div>
        </div>

        {/* Circular fit gauge */}
        <div className="featured-fit-gauge">
          <ScoreRing score={fit} size={70} strokeWidth={5} />
        </div>
      </div>

      {/* Highlight Panels Row */}
      <div className="featured-panels-row">
        {/* Why you match */}
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

        {/* Skills to build */}
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

        <button
          type="button"
          className={`featured-apply-btn ${isApplied ? 'is-applied' : ''}`}
          disabled={isApplied}
          onClick={() => onApply(job)}
          data-testid="featured-apply-btn"
        >
          {isApplied ? 'Applied ✓' : 'Apply now'}
        </button>
      </div>
    </article>
  );
}
