import React from 'react';
import './ProfileSection.css';

export default function ProfileSection({
  id,
  title,
  action,
  isEditing = false,
  onSave,
  onCancel,
  children,
  hasDivider = true,
  testId,
  editTestId,
}) {
  const headingId = `heading-${id}`;

  return (
    <section
      className={`profile-section profile-section-${id} ${hasDivider ? 'with-divider' : ''}`}
      aria-labelledby={headingId}
      data-testid={testId || `profile-section-${id}`}
    >
      <div className="profile-section-header">
        <h2 id={headingId} className="profile-section-title">
          {title}
        </h2>
        {isEditing ? (
          <div className="profile-section-edit-actions">
            <button
              type="button"
              className="profile-section-action-btn"
              onClick={onSave}
              data-testid={`${id}-save-btn`}
            >
              Save
            </button>
            <span className="profile-section-action-separator" aria-hidden="true">·</span>
            <button
              type="button"
              className="profile-section-action-btn"
              onClick={onCancel}
              data-testid={`${id}-cancel-btn`}
            >
              Cancel
            </button>
          </div>
        ) : (
          action && (
            <button
              type="button"
              className="profile-section-action-btn"
              onClick={action.onClick}
              data-testid={editTestId || `${id}-action-btn`}
            >
              {action.label}
            </button>
          )
        )}
      </div>
      <div className="profile-section-content">{children}</div>
    </section>
  );
}
