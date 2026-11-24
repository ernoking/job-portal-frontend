import Checkbox from '../Checkbox';
import { PROFILE_FIELDS, readField } from '../../onboarding/profileRefresh.js';
import './ProfileRefreshSelection.css';

function summary(value) {
  if (Array.isArray(value)) {
    return value.map(item => typeof item === 'string' ? item : item.title ||
      [item.role, item.organization].filter(Boolean).join(' · ') ||
      [item.language, item.level].filter(Boolean).join(' — ')).join('; ') || 'Not provided';
  }
  return value || 'Not provided';
}

export default function ProfileRefreshSelection({ preview, fields, onToggle, disabled = false }) {
  if (!preview) return null;
  if (!preview.baseProfile) return <p className="profile-review-notice" role="status">
    Review and correct the extracted details below. Your profile is saved only when you confirm your career goals.
  </p>;
  return <fieldset className="profile-refresh-selection" disabled={disabled}>
    <legend>Choose what to refresh from this CV</legend>
    <p className="profile-refresh-help">Check a field to use the new CV value. Unchecked fields keep their saved values.
      You can correct the result below. Nothing changes in your saved profile until you confirm your career goals.</p>
    {disabled && <p className="profile-refresh-help" role="status">Save or cancel your open edits before changing these choices.</p>}
    <div className="profile-refresh-fields">
      {PROFILE_FIELDS.map(([field, label]) => <div className="profile-refresh-field" key={field}>
        <Checkbox id={`refresh-${field.replace('.', '-')}`} checked={fields.includes(field)} onChange={() => onToggle(field)}>
          Refresh {label.toLowerCase()}
        </Checkbox>
        <dl className="profile-refresh-values">
          <div><dt>Saved</dt><dd>{summary(readField(preview.baseProfile, field))}</dd></div>
          <div><dt>New CV</dt><dd>{summary(readField(preview.generatedProfile, field))}</dd></div>
        </dl>
      </div>)}
    </div>
  </fieldset>;
}
