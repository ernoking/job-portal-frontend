import './MatchRow.css';

export default function MatchRow({ job, onSelect }) {
  if (!job) return null;

  const { id, title, company, location, workType, employmentType = 'Full-time', fit } = job;

  const metaString = [location, workType, employmentType]
    .filter(Boolean)
    .join(' · ');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <div
      className="match-row-card"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(id)}
      onKeyDown={handleKeyDown}
      aria-label={`View match details for ${title} at ${company}, ${fit}% fit`}
      data-testid={`match-row-${id}`}
    >
      <div className="match-row-left">
        <span className="match-row-company">{company}</span>
        <h3 className="match-row-title">{title}</h3>
        <p className="match-row-meta">{metaString}</p>
      </div>

      <div className="match-row-right">
        <span className="match-row-fit">{fit}% fit</span>
      </div>
    </div>
  );
}
