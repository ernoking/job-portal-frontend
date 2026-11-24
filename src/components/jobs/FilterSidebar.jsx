import './FilterSidebar.css';

export default function FilterSidebar({
  filters,
  onFilterChange,
  disabledWorkType = false,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const {
    keywords = '',
    location = 'Budapest',
    workTypes = ['Remote', 'Hybrid'],
    seniorityLevels = [],
    minMatch = 80,
  } = filters;

  const handleKeywordChange = (e) => {
    onFilterChange({ ...filters, keywords: e.target.value });
  };

  const handleLocationChange = (e) => {
    onFilterChange({ ...filters, location: e.target.value });
  };

  const handleWorkTypeToggle = (type) => {
    const nextWorkTypes = workTypes.includes(type)
      ? workTypes.filter((t) => t !== type)
      : [...workTypes, type];
    onFilterChange({ ...filters, workTypes: nextWorkTypes });
  };

  const handleSeniorityToggle = (level) => {
    const nextSeniority = seniorityLevels.includes(level)
      ? seniorityLevels.filter((s) => s !== level)
      : [...seniorityLevels, level];
    onFilterChange({ ...filters, seniorityLevels: nextSeniority });
  };

  const handleMinMatchChange = (e) => {
    onFilterChange({ ...filters, minMatch: Number(e.target.value) });
  };

  // Calculate percentage along the slider track for the background gradient
  // Range is min 10 to max 100: percent = ((minMatch - 10) / (100 - 10)) * 100
  const progressPercent = Math.max(0, Math.min(100, ((minMatch - 10) / 90) * 100));

  return (
    <aside className={`filter-sidebar ${isCollapsed ? 'is-collapsed' : ''}`} aria-label="Refine matches">
      <div className="filter-sidebar-header">
        <h2 className="filter-sidebar-title">Refine matches</h2>
        {onToggleCollapse && (
          <button
            type="button"
            className="filter-sidebar-toggle-btn"
            onClick={onToggleCollapse}
            aria-label="Collapse filters sidebar"
          >
            ‹
          </button>
        )}
      </div>

      {/* Keywords Filter */}
      <div className="filter-group">
        <label htmlFor="filter-keywords" className="filter-label">
          Keywords
        </label>
        <input
          id="filter-keywords"
          type="text"
          className="filter-input"
          placeholder="Role or skill"
          value={keywords}
          onChange={handleKeywordChange}
        />
      </div>

      {/* Location Filter */}
      <div className="filter-group">
        <label htmlFor="filter-location" className="filter-label">
          Location
        </label>
        <input
          id="filter-location"
          type="text"
          className="filter-input"
          placeholder="Location"
          value={location}
          onChange={handleLocationChange}
        />
      </div>

      {/* Work Type Filter */}
      <div className="filter-group">
        <div className="filter-label-row">
          <span className="filter-label">Work type</span>
          {disabledWorkType && (
            <span
              className="filter-coming-soon-badge"
              title="Work arrangement filter coming soon"
            >
              Coming soon
            </span>
          )}
        </div>
        {disabledWorkType && (
          <p className="filter-coming-soon-note">
            Work arrangement filter coming soon
          </p>
        )}
        <div className="filter-checkbox-group">
          {['Remote', 'Hybrid', 'On-site'].map((type) => {
            const isChecked = workTypes.includes(type);
            return (
              <label
                key={type}
                className={`filter-checkbox-item ${disabledWorkType ? 'is-disabled' : ''}`}
                title={disabledWorkType ? 'Work arrangement filter coming soon' : undefined}
              >
                <input
                  type="checkbox"
                  className="filter-checkbox-input"
                  checked={isChecked}
                  disabled={disabledWorkType}
                  onChange={() => !disabledWorkType && handleWorkTypeToggle(type)}
                />
                <span
                  className={`filter-checkbox-custom ${isChecked ? 'is-checked' : ''} ${disabledWorkType ? 'is-disabled' : ''}`}
                  aria-hidden="true"
                >
                  {isChecked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="#FFFFFF"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="filter-checkbox-text">{type}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Seniority Level Filter (Figma Refine Matches) */}
      <div className="filter-group">
        <div className="filter-label-row">
          <span className="filter-label">Seniority level</span>
        </div>
        <div className="filter-checkbox-group">
          {['Internship', 'Junior', 'Mid', 'Senior', 'Lead'].map((level) => {
            const isChecked = seniorityLevels.includes(level);
            return (
              <label key={level} className="filter-checkbox-item">
                <input
                  type="checkbox"
                  className="filter-checkbox-input"
                  checked={isChecked}
                  onChange={() => handleSeniorityToggle(level)}
                />
                <span
                  className={`filter-checkbox-custom ${isChecked ? 'is-checked' : ''}`}
                  aria-hidden="true"
                >
                  {isChecked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="#FFFFFF"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="filter-checkbox-text">{level}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Minimum Match Slider */}
      <div className="filter-group">
        <label htmlFor="filter-min-match" className="filter-label">
          Minimum match
        </label>
        <div className="filter-slider-container">
          <input
            id="filter-min-match"
            type="range"
            min="10"
            max="100"
            value={minMatch}
            onChange={handleMinMatchChange}
            className="filter-slider-input"
            style={{
              background: `linear-gradient(to right, var(--lime) 0%, var(--lime) ${progressPercent}%, var(--track-rest) ${progressPercent}%, var(--track-rest) 100%)`,
            }}
          />
          <div className="filter-slider-caption">
            {minMatch}% and above
          </div>
        </div>
      </div>
    </aside>
  );
}
