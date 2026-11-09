import React from 'react';
import './Field.css';

export default function Field({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  hint,
  width,
  style,
  autoComplete,
  required = false,
}) {
  return (
    <div className="field-group" style={{ ...(width ? { width } : {}), ...style }}>
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}
      <div className="field-input-wrapper">
        <input
          id={id}
          name={name || id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          className={`field-input ${error ? 'field-input-error' : ''}`}
        />
        {error && <span className="field-error-msg" data-testid={`${id}-error`}>{error}</span>}
      </div>
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
