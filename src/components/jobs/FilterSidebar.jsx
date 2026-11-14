import './FilterSidebar.css';

export default function FilterSidebar({ filters, onFilterChange }) {
  const {
    keywords = '',
    location = 'Budapest',
    workTypes = ['Remote', 'Hybrid'],
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

  const handleMinMatchChange = (e) => {
    onFilterChange({ ...filters, minMatch: Number(e.target.value) });
  };

  // Calculate percentage along the slider track for the background gradient
  // Range is min 10 to max 100: percent = ((minMatch - 10) / (100 - 10)) * 100
  const progressPercent = Math.max(0, Math.min(100, ((minMatch - 10) / 90) * 100));

  return (
    <aside className="filter-sidebar" aria-label="Refine matches">
      <h2 className="filter-sidebar-title">Refine matches</h2>

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
        <span className="filter-label">Work type</span>
        <div className="filter-checkbox-group">
          {['Remote', 'Hybrid', 'On-site'].map((type) => {
            const isChecked = workTypes.includes(type);
            return (
              <label key={type} className="filter-checkbox-item">
                <input
                  type="checkbox"
                  className="filter-checkbox-input"
                  checked={isChecked}
                  onChange={() => handleWorkTypeToggle(type)}
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
                <span className="filter-checkbox-text">{type}</span>
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
