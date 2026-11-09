import React from 'react';
import './LanguageRow.css';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function LanguageRow({
  id,
  language,
  level,
  onLevelChange,
  isNew = false,
  onNameChange,
  onBlurNew,
}) {
  const safeId = (language || 'new').toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="language-row" data-testid={`language-row-${safeId}`}>
      <div className="language-col-name">
        {isNew ? (
          <input
            type="text"
            className="language-input-new"
            value={language}
            onChange={(e) => onNameChange && onNameChange(id, e.target.value)}
            onBlur={() => onBlurNew && onBlurNew(id)}
            placeholder="Language"
            autoFocus
            data-testid="input-new-language"
          />
        ) : (
          <div className="language-chip" data-testid={`language-chip-${safeId}`}>
            {language}
          </div>
        )}
      </div>

      <div className="language-col-level">
        <div className="language-select-wrapper">
          <select
            className="language-select"
            value={level}
            onChange={(e) => onLevelChange(id, e.target.value)}
            aria-label={`Proficiency level for ${language || 'language'}`}
            data-testid={`language-select-${safeId}`}
          >
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
          <svg
            className="language-select-chevron"
            width="6"
            height="4"
            viewBox="0 0 8 5"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 1L4 4L7 1"
              stroke="#66726B"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
