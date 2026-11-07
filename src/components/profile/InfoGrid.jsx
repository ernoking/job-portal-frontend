import React from 'react';
import './InfoGrid.css';

export default function InfoGrid({
  items = [],
  isEditing = false,
  values = {},
  onChange,
  errors = {},
}) {
  if (isEditing) {
    return (
      <div className="info-grid is-editing">
        {items.map((item) => (
          <div key={item.key} className="info-grid-field">
            <label htmlFor={`field-${item.key}`} className="info-grid-label">
              {item.label}
            </label>
            <input
              id={`field-${item.key}`}
              type={item.type || 'text'}
              className={`info-grid-input ${errors[item.key] ? 'input-error' : ''}`}
              value={values[item.key] ?? ''}
              onChange={(e) => onChange(item.key, e.target.value)}
              placeholder={item.placeholder || ''}
              data-testid={`input-${item.key}`}
            />
            {errors[item.key] && (
              <span className="info-grid-error" role="alert">
                {errors[item.key]}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <dl className="info-grid">
      {items.map((item) => {
        const val = values[item.key];
        const isEmpty = val === undefined || val === null || val === '';
        return (
          <div key={item.key} className="info-grid-item">
            <dt className="info-grid-label">{item.label}</dt>
            <dd className={`info-grid-value ${isEmpty ? 'is-empty' : ''}`}>
              {isEmpty ? 'Not provided' : val}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
