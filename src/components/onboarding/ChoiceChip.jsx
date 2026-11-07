import React from 'react';
import './ChoiceChip.css';

export default function ChoiceChip({
  label,
  selected = false,
  onClick,
  type = 'multi', // 'multi' (work type with check) or 'single' (seniority with dot)
  testId,
  role = 'button',
}) {
  const isRadio = role === 'radio';

  return (
    <button
      type="button"
      role={role}
      className={`choice-chip ${selected ? 'is-selected' : ''}`}
      onClick={onClick}
      aria-pressed={!isRadio ? selected : undefined}
      aria-checked={isRadio ? selected : undefined}
      data-testid={testId || `chip-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {selected && type === 'multi' && (
        <span className="choice-chip-icon" aria-hidden="true">✓</span>
      )}
      {selected && type === 'single' && (
        <span className="choice-chip-dot" aria-hidden="true">●</span>
      )}
      <span className="choice-chip-label">{label}</span>
    </button>
  );
}
