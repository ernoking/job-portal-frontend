import './MatchRow.css';

export default function MatchRow({ job, onSelect, onApply, isApplied = false }) {
  if (!job) return null;

  const { id, title, company, location, workType, employmentType = '', fit } = job;

  const metaString = [location, workType, employmentType]
    .filter(Boolean)
    .join(' · ');

  const hasScore = typeof fit === 'number' && !Number.isNaN(fit);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  };

  const handleApplyClick = (e) => {
    e.stopPropagation();
    onApply?.(job);
  };

  return (
    <div
      className="match-row-card"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(id)}
      onKeyDown={handleKeyDown}
      aria-label={`View match details for ${title} at ${company}${hasScore ? `, ${fit}% fit` : ''}`}
      data-testid={`match-row-${id}`}
    >
      <div className="match-row-left">
        <span className="match-row-company">{company}</span>
        <h3 className="match-row-title">{title}</h3>
        {metaString && <p className="match-row-meta">{metaString}</p>}
      </div>

      <div className="match-row-right">
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
  );
}
