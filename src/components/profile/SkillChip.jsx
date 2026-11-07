import React from 'react';
import './SkillChip.css';

export default function SkillChip({ skill, onRemove }) {
  const safeId = skill.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="skill-chip" data-testid={`skill-chip-${safeId}`}>
      <span className="skill-chip-text">{skill}</span>
      <button
        type="button"
        className="skill-chip-remove"
        onClick={() => onRemove(skill)}
        aria-label={`Remove ${skill}`}
        data-testid={`skill-remove-${safeId}`}
      >
        <span aria-hidden="true" className="skill-chip-x">×</span>
      </button>
    </div>
  );
}
