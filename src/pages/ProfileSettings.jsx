import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNav from '../components/nav/AppNav';
import VerifyPhoneModal from '../components/profile/VerifyPhoneModal';
import DeleteAccountModal from '../components/profile/DeleteAccountModal';
import { useAuth } from '../auth';
import { deleteAccount } from '../api/auth';
import { getDraft, setDraft } from '../onboarding/draftStore';
import './ProfileSettings.css';

const DEFAULT_PROFILE = {
  name: 'Alex Morgan',
  email: 'alex.morgan@email.com',
  phone: '+36 30 123 4567',
  isPhoneVerified: false,
  location: 'Budapest, Hungary',
  title: 'Product Designer',
  summary:
    'Product designer with 5+ years of experience shaping fintech and SaaS products. Strong in design systems, user research and rapid prototyping. Looking for a mid-level product design role where I can own end-to-end flows and grow towards a lead position.',
  workExperience: [
    {
      id: 'exp-1',
      role: 'Product Designer',
      company: 'Acme Studio',
      period: '2019 – 2024',
      description:
        'Led UX for the onboarding flow, ran research sessions with 30+ users and maintained the shared design system used by four product squads.',
    },
    {
      id: 'exp-2',
      role: 'Design Intern',
      company: 'Studio North',
      period: '2018 – 2019',
      description:
        'Supported senior designers with wireframes, prototypes and usability test synthesis for client projects.',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'Design system for FinTrack app',
      period: '2023',
      description:
        'Built a component library and documentation for a fintech mobile app.',
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'MSc Interaction Design',
      type: 'Degree',
      school: 'MOME',
      year: 'Graduated 2021',
    },
    {
      id: 'edu-2',
      degree: 'Google UX Design Professional Certificate',
      type: 'Certification',
      school: 'Coursera',
      year: '2022',
    },
  ],
  techSkills: [
    'Figma',
    'Prototyping',
    'Design systems',
    'User research',
    'Usability testing',
    'Wireframing',
    'Jira',
    'SQL',
  ],
  softSkills: [
    'Communication',
    'Stakeholder management',
    'Facilitation',
    'Mentoring',
  ],
  languages: [
    { id: 'lang-1', name: 'English', level: 'C1' },
    { id: 'lang-2', name: 'Hungarian', level: 'B2' },
    { id: 'lang-3', name: 'Spanish', level: 'A2' },
  ],
  excludedCompanies: [
    { id: 'c-1', name: 'Acme Studio', note: 'current employer' },
    { id: 'c-2', name: 'Globex Corp' },
    { id: 'c-3', name: 'Initech' },
  ],
};

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { user, token, signOut } = useAuth();

  // Load draft data merged with defaults
  const [profileData, setProfileData] = useState(() => {
    const draft = getDraft() || {};
    const candidate = draft.candidate || {};
    return {
      ...DEFAULT_PROFILE,
      name:
        user?.firstName && user?.lastName
          ? `${user.firstName} ${user.lastName}`
          : candidate.name || DEFAULT_PROFILE.name,
      email: user?.email || candidate.email || DEFAULT_PROFILE.email,
      phone: candidate.phone || DEFAULT_PROFILE.phone,
      location: candidate.location || DEFAULT_PROFILE.location,
    };
  });

  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState(profileData.summary);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);

  // Exclusions input state
  const [newCompanyInput, setNewCompanyInput] = useState('');

  // Skill input state
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillText, setNewSkillText] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('tech');

  // Modals state
  const [isVerifyPhoneOpen, setIsVerifyPhoneOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Personal Info Form changes
  const handleInputChange = (field, value) => {
    setProfileData((prev) => {
      const updated = { ...prev, [field]: value };
      setDraft({ candidate: { ...getDraft()?.candidate, [field]: value } });
      return updated;
    });
  };

  const handleSavePersonalInfo = (e) => {
    e.preventDefault();
    setDraft({
      candidate: {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        location: profileData.location,
      },
    });
    setSaveSuccessMessage(true);
    setTimeout(() => setSaveSuccessMessage(false), 2500);
  };

  // Summary handlers
  const handleSaveSummary = () => {
    setProfileData((prev) => ({ ...prev, summary: summaryDraft }));
    setIsEditingSummary(false);
  };

  // Company exclusion handlers
  const handleAddCompany = (e) => {
    e.preventDefault();
    const trimmed = newCompanyInput.trim();
    if (!trimmed) return;
    setProfileData((prev) => ({
      ...prev,
      excludedCompanies: [
        ...prev.excludedCompanies,
        { id: `c-${Date.now()}`, name: trimmed },
      ],
    }));
    setNewCompanyInput('');
  };

  const handleRemoveCompany = (id) => {
    setProfileData((prev) => ({
      ...prev,
      excludedCompanies: prev.excludedCompanies.filter((c) => c.id !== id),
    }));
  };

  // Skill handlers
  const handleRemoveSkill = (category, skillToRemove) => {
    setProfileData((prev) => {
      if (category === 'tech') {
        return {
          ...prev,
          techSkills: prev.techSkills.filter((s) => s !== skillToRemove),
        };
      }
      return {
        ...prev,
        softSkills: prev.softSkills.filter((s) => s !== skillToRemove),
      };
    });
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = newSkillText.trim();
    if (!trimmed) return;
    setProfileData((prev) => {
      if (newSkillCategory === 'tech') {
        if (prev.techSkills.includes(trimmed)) return prev;
        return { ...prev, techSkills: [...prev.techSkills, trimmed] };
      }
      if (prev.softSkills.includes(trimmed)) return prev;
      return { ...prev, softSkills: [...prev.softSkills, trimmed] };
    });
    setNewSkillText('');
    setIsAddingSkill(false);
  };

  // Language handlers
  const handleRemoveLanguage = (id) => {
    setProfileData((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l.id !== id),
    }));
  };

  const handleLanguageLevelChange = (id, newLevel) => {
    setProfileData((prev) => ({
      ...prev,
      languages: prev.languages.map((l) => (l.id === id ? { ...l, level: newLevel } : l)),
    }));
  };

  // Phone verification complete handler
  const handlePhoneVerified = useCallback(() => {
    setIsVerifyPhoneOpen(false);
    setProfileData((prev) => ({ ...prev, isPhoneVerified: true }));
  }, []);

  // Account deletion handler (AJSP-11, AJSP-60, AJSP-63)
  const handleConfirmDelete = async (password) => {
    setIsDeleting(true);
    try {
      await deleteAccount(password, token);
      await signOut();
      navigate('/login');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="profile-settings-page">
      <AppNav activeTab="profile" />

      <main className="profile-settings-main">
        {/* Profile Hero (Figma 199:262 / 219:132) */}
        <section className="profile-hero-section">
          {/* Cover Banner */}
          <div className="profile-cover-banner">
            {/* Abstract decorative SVG rings & sparkles matching Figma */}
            <svg
              className="profile-cover-decor"
              viewBox="0 0 1260 200"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <circle cx="1110" cy="62" r="90" stroke="rgba(221, 248, 107, 0.35)" strokeWidth="1" fill="none" />
              <circle cx="1110" cy="62" r="170" stroke="rgba(221, 248, 107, 0.35)" strokeWidth="1" fill="none" />
              <circle cx="1110" cy="62" r="250" stroke="rgba(221, 248, 107, 0.35)" strokeWidth="1" fill="none" />
              <circle cx="938" cy="158" r="8" fill="#8AB345" />
              <circle cx="1138" cy="147" r="28" fill="#DDF86B" />
              <path
                d="M76 45.5 C76 52 70 58 63.5 58 C70 58 76 64 76 70.5 C76 64 82 58 88.5 58 C82 58 76 52 76 45.5 Z"
                fill="#DDF86B"
              />
            </svg>

            <button
              type="button"
              className="profile-change-cover-btn"
              onClick={() => alert('Cover photo upload options')}
              data-testid="change-cover-btn"
            >
              Change cover
            </button>
          </div>

          {/* Profile Header Row */}
          <div className="profile-header-card">
            <div
              className="profile-avatar-card"
              data-testid="profile-avatar"
              onClick={() => alert('Photo upload dialog')}
              role="button"
              tabIndex={0}
              aria-label="Upload profile photo"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#65756c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span className="profile-avatar-upload-text">Upload photo</span>
            </div>

            <div className="profile-identity-col">
              <div className="profile-identity-name-row">
                <h1 className="profile-identity-name">{profileData.name}</h1>
                <span className="profile-inline-edit-tag">Edit</span>
              </div>
              <p className="profile-identity-title">{profileData.title}</p>
              <div className="profile-identity-contact-row">
                <span>{profileData.location}</span>
                <span className="bullet">·</span>
                <span>{profileData.email}</span>
                <span className="bullet">·</span>
                <span>{profileData.phone}</span>
                {profileData.isPhoneVerified && (
                  <span className="profile-verified-badge">✓ Verified</span>
                )}
              </div>
            </div>

            <div className="profile-photo-actions">
              <button
                type="button"
                className="profile-photo-action-btn secondary"
                onClick={() => alert('Photo upload dialog')}
                data-testid="upload-photo-btn"
              >
                Upload photo
              </button>
              <button
                type="button"
                className="profile-photo-action-btn primary"
                onClick={() => alert('Extracting photo from uploaded CV...')}
                data-testid="extract-photo-cv-btn"
              >
                Extract from CV
              </button>
            </div>
          </div>
        </section>

        {/* Content Columns (Figma 199:296 / 219:132) */}
        <div className="profile-settings-layout">
          {/* Left Column: Personal info, summary, experience, skills, languages */}
          <div className="profile-settings-col-left">
            {/* 1. Personal Information */}
            <section className="profile-card" aria-labelledby="personal-info-heading">
              <div className="profile-card-header">
                <h2 id="personal-info-heading" className="profile-card-title">
                  Personal information
                </h2>
                <button
                  type="button"
                  className="profile-card-header-btn"
                  onClick={handleSavePersonalInfo}
                  data-testid="save-personal-info-btn"
                >
                  {saveSuccessMessage ? 'Saved ✓' : 'Save changes'}
                </button>
              </div>

              <form onSubmit={handleSavePersonalInfo} className="profile-form-grid">
                <div className="profile-form-field">
                  <label htmlFor="prof-name" className="profile-form-label">
                    Name
                  </label>
                  <input
                    id="prof-name"
                    type="text"
                    className="profile-form-input"
                    value={profileData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div className="profile-form-field">
                  <label htmlFor="prof-email" className="profile-form-label">
                    Email
                  </label>
                  <input
                    id="prof-email"
                    type="email"
                    className="profile-form-input"
                    value={profileData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div className="profile-form-field">
                  <div className="profile-form-label-row">
                    <label htmlFor="prof-phone" className="profile-form-label">
                      Phone
                    </label>
                    {profileData.isPhoneVerified ? (
                      <span className="profile-verified-tag">✓ Verified</span>
                    ) : (
                      <button
                        type="button"
                        className="profile-verify-tag-btn"
                        onClick={() => setIsVerifyPhoneOpen(true)}
                        data-testid="profile-verify-phone-btn"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                  <input
                    id="prof-phone"
                    type="tel"
                    className="profile-form-input"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>

                <div className="profile-form-field">
                  <label htmlFor="prof-location" className="profile-form-label">
                    Location
                  </label>
                  <input
                    id="prof-location"
                    type="text"
                    className="profile-form-input"
                    value={profileData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>
              </form>
            </section>

            {/* 2. Personal Summary */}
            <section className="profile-card" aria-labelledby="summary-heading">
              <div className="profile-card-header">
                <div className="profile-card-title-group">
                  <h2 id="summary-heading" className="profile-card-title">
                    Personal summary
                  </h2>
                  <span className="profile-ai-badge">AI pre-filled from CV</span>
                </div>
                <button
                  type="button"
                  className="profile-card-header-btn"
                  onClick={() => {
                    if (isEditingSummary) handleSaveSummary();
                    else setIsEditingSummary(true);
                  }}
                  data-testid="edit-summary-btn"
                >
                  {isEditingSummary ? 'Save' : 'Edit'}
                </button>
              </div>

              {isEditingSummary ? (
                <div className="profile-summary-edit-box">
                  <textarea
                    className="profile-summary-textarea"
                    rows={4}
                    value={summaryDraft}
                    onChange={(e) => setSummaryDraft(e.target.value)}
                  />
                  <div className="profile-summary-edit-actions">
                    <button
                      type="button"
                      className="profile-action-secondary-btn"
                      onClick={() => {
                        setSummaryDraft(profileData.summary);
                        setIsEditingSummary(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="profile-action-primary-btn"
                      onClick={handleSaveSummary}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <p className="profile-summary-text">{profileData.summary}</p>
              )}
            </section>

            {/* 3. Work Experience */}
            <section className="profile-card" aria-labelledby="experience-heading">
              <div className="profile-card-header">
                <h2 id="experience-heading" className="profile-card-title">
                  Work experience
                </h2>
                <button
                  type="button"
                  className="profile-card-header-btn"
                  onClick={() => alert('Add role dialog')}
                  data-testid="add-role-btn"
                >
                  + Add role
                </button>
              </div>

              <div className="profile-timeline">
                {profileData.workExperience.map((item) => (
                  <div key={item.id} className="profile-timeline-item">
                    <div className="profile-timeline-rail">
                      <div className="profile-timeline-node" />
                      <div className="profile-timeline-line" />
                    </div>
                    <div className="profile-timeline-content">
                      <div className="profile-timeline-header">
                        <div>
                          <h3 className="profile-timeline-role">{item.role}</h3>
                          <p className="profile-timeline-meta">
                            {item.company} · {item.period}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="profile-inline-action-btn"
                          onClick={() => alert(`Edit role ${item.role}`)}
                        >
                          Edit
                        </button>
                      </div>
                      <p className="profile-timeline-desc">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Projects */}
            <section className="profile-card" aria-labelledby="projects-heading">
              <div className="profile-card-header">
                <h2 id="projects-heading" className="profile-card-title">
                  Projects
                </h2>
              </div>

              <div className="profile-projects-list">
                {profileData.projects.map((proj) => (
                  <div key={proj.id} className="profile-project-item">
                    <div className="profile-project-info">
                      <h3 className="profile-project-title">{proj.title}</h3>
                      <p className="profile-project-desc">
                        {proj.period} · {proj.description}
                      </p>
                    </div>
                    <div className="profile-item-actions">
                      <button
                        type="button"
                        className="profile-inline-action-btn"
                        onClick={() => alert(`Edit project ${proj.title}`)}
                      >
                        Edit
                      </button>
                      <span className="profile-action-bullet">·</span>
                      <button
                        type="button"
                        className="profile-inline-action-btn danger"
                        onClick={() =>
                          setProfileData((prev) => ({
                            ...prev,
                            projects: prev.projects.filter((p) => p.id !== proj.id),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="profile-card-bottom-btn"
                onClick={() => alert('Add project dialog')}
                data-testid="add-project-btn"
              >
                + Add project
              </button>
            </section>

            {/* 5. Education and Certifications */}
            <section className="profile-card" aria-labelledby="education-heading">
              <div className="profile-card-header">
                <h2 id="education-heading" className="profile-card-title">
                  Education and certifications
                </h2>
              </div>

              <div className="profile-education-list">
                {profileData.education.map((edu) => (
                  <div key={edu.id} className="profile-education-item">
                    <div className="profile-education-info">
                      <div className="profile-education-title-row">
                        <h3 className="profile-education-degree">{edu.degree}</h3>
                        <span className={`profile-edu-badge ${edu.type?.toLowerCase().includes('cert') ? 'is-cert' : ''}`}>
                          {edu.type}
                        </span>
                      </div>
                      <p className="profile-education-meta">
                        {edu.school} · {edu.year}
                      </p>
                    </div>
                    <div className="profile-item-actions">
                      <button
                        type="button"
                        className="profile-inline-action-btn"
                        onClick={() => alert(`Edit ${edu.degree}`)}
                      >
                        Edit
                      </button>
                      <span className="profile-action-bullet">·</span>
                      <button
                        type="button"
                        className="profile-inline-action-btn danger"
                        onClick={() =>
                          setProfileData((prev) => ({
                            ...prev,
                            education: prev.education.filter((e) => e.id !== edu.id),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="profile-card-bottom-btn-group">
                <button
                  type="button"
                  className="profile-card-bottom-btn"
                  onClick={() => alert('Add education dialog')}
                  data-testid="add-education-btn"
                >
                  + Add education
                </button>
                <button
                  type="button"
                  className="profile-card-bottom-btn"
                  onClick={() => alert('Add certification dialog')}
                  data-testid="add-certification-btn"
                >
                  + Add certification
                </button>
              </div>
            </section>

            {/* 6. Extracted Skills */}
            <section className="profile-card" aria-labelledby="skills-heading">
              <div className="profile-card-header">
                <div className="profile-card-title-group">
                  <h2 id="skills-heading" className="profile-card-title">
                    Extracted skills
                  </h2>
                  <span className="profile-ai-badge">AI pre-filled from CV</span>
                </div>
                <button
                  type="button"
                  className="profile-card-header-btn"
                  onClick={() => setIsAddingSkill((prev) => !prev)}
                  data-testid="add-skill-btn"
                >
                  + Add skill
                </button>
              </div>

              {isAddingSkill && (
                <form onSubmit={handleAddSkill} className="profile-add-skill-box">
                  <input
                    type="text"
                    className="profile-add-skill-input"
                    placeholder="Enter skill name..."
                    value={newSkillText}
                    onChange={(e) => setNewSkillText(e.target.value)}
                  />
                  <select
                    className="profile-add-skill-select"
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value)}
                  >
                    <option value="tech">Technical Skill</option>
                    <option value="soft">Soft Skill</option>
                  </select>
                  <button type="submit" className="profile-action-primary-btn">
                    Add
                  </button>
                  <button
                    type="button"
                    className="profile-action-secondary-btn"
                    onClick={() => setIsAddingSkill(false)}
                  >
                    Cancel
                  </button>
                </form>
              )}

              <div className="profile-skills-group">
                <h4 className="profile-skills-subhead">TECHNICAL SKILLS</h4>
                <div className="profile-skills-chips">
                  {profileData.techSkills.map((skill) => (
                    <span key={skill} className="profile-skill-chip tech">
                      {skill}
                      <button
                        type="button"
                        className="profile-skill-remove"
                        onClick={() => handleRemoveSkill('tech', skill)}
                        aria-label={`Remove ${skill}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="profile-skills-group">
                <h4 className="profile-skills-subhead">SOFT SKILLS</h4>
                <div className="profile-skills-chips">
                  {profileData.softSkills.map((skill) => (
                    <span key={skill} className="profile-skill-chip soft">
                      {skill}
                      <button
                        type="button"
                        className="profile-skill-remove"
                        onClick={() => handleRemoveSkill('soft', skill)}
                        aria-label={`Remove ${skill}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* 7. Languages */}
            <section className="profile-card" aria-labelledby="languages-heading">
              <div className="profile-card-header">
                <h2 id="languages-heading" className="profile-card-title">
                  Languages
                </h2>
                <button
                  type="button"
                  className="profile-card-header-btn"
                  onClick={() => {
                    const newLang = prompt('Language name:');
                    if (newLang) {
                      setProfileData((prev) => ({
                        ...prev,
                        languages: [
                          ...prev.languages,
                          { id: `lang-${Date.now()}`, name: newLang, level: 'B1' },
                        ],
                      }));
                    }
                  }}
                  data-testid="add-language-btn"
                >
                  + Add language
                </button>
              </div>

              <div className="profile-languages-list">
                {profileData.languages.map((lang) => (
                  <div key={lang.id} className="profile-language-pair">
                    <span className="profile-language-chip">
                      {lang.name}
                      <button
                        type="button"
                        className="profile-skill-remove"
                        onClick={() => handleRemoveLanguage(lang.id)}
                        aria-label={`Remove ${lang.name}`}
                      >
                        ×
                      </button>
                    </span>
                    <div className="profile-language-select-wrap">
                      <select
                        className="profile-language-level-select"
                        value={lang.level}
                        onChange={(e) => handleLanguageLevelChange(lang.id, e.target.value)}
                        aria-label={`Level for ${lang.name}`}
                      >
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="C1">C1</option>
                        <option value="C2">C2</option>
                      </select>
                      <svg className="profile-select-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#65756C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Profile completion, company exclusions, subscription, delete account */}
          <div className="profile-settings-col-right">
            {/* 1. Profile Completion (Figma 199:410) */}
            <section className="profile-card" aria-labelledby="completion-heading">
              <div className="profile-card-header">
                <h2 id="completion-heading" className="profile-card-title">
                  Profile completion
                </h2>
              </div>

              <div className="profile-progress-row">
                <span className="profile-completion-pct">85%</span>
                <div className="profile-progress-track" aria-hidden="true">
                  <div className="profile-progress-fill" style={{ width: '85%' }} />
                </div>
              </div>

              <ul className="profile-checklist" aria-label="Profile completion checklist">
                <li className="profile-checklist-item is-done">
                  <span className="profile-olive-check" aria-hidden="true">✓</span>
                  <span>CV uploaded and parsed</span>
                </li>
                <li className="profile-checklist-item is-done">
                  <span className="profile-olive-check" aria-hidden="true">✓</span>
                  <span>Career preferences set</span>
                </li>
                <li className="profile-checklist-item">
                  <span className="profile-empty-circle" aria-hidden="true" />
                  <span className="profile-todo-text">Add a profile photo</span>
                </li>
              </ul>
            </section>

            {/* 2. Company Exclusions (Figma 199:431) */}
            <section className="profile-card" aria-labelledby="exclusions-heading">
              <div className="profile-card-header">
                <h2 id="exclusions-heading" className="profile-card-title">
                  Company exclusions
                </h2>
              </div>
              <p className="profile-card-subtitle">
                Companies you do not want recommendations from – e.g. your current employer. We automatically filter out their openings from your feed.
              </p>

              <form onSubmit={handleAddCompany} className="profile-search-row">
                <div className="profile-search-input-wrap">
                  <svg className="profile-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#88998F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="profile-search-input"
                    placeholder="Search or type a company name…"
                    value={newCompanyInput}
                    onChange={(e) => setNewCompanyInput(e.target.value)}
                    data-testid="company-exclusion-input"
                  />
                </div>
                <button
                  type="submit"
                  className="profile-add-btn"
                  data-testid="add-exclusion-btn"
                >
                  Add
                </button>
              </form>

              <div className="profile-excluded-chips">
                {profileData.excludedCompanies.map((comp) => (
                  <span key={comp.id} className="profile-excluded-chip">
                    <span className="exclusion-name">{comp.name}</span>
                    {comp.note && <span className="exclusion-note">· {comp.note}</span>}
                    <button
                      type="button"
                      className="profile-chip-remove"
                      onClick={() => handleRemoveCompany(comp.id)}
                      aria-label={`Remove exclusion for ${comp.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <p className="profile-exclusions-footer">
                {profileData.excludedCompanies.length} {profileData.excludedCompanies.length === 1 ? 'company' : 'companies'} hidden from your feed
              </p>
            </section>

            {/* 3. Company Exclusions is the last card in right column in Figma 199:104 */}
          </div>
        </div>

        {/* Full-Width Delete Account Banner (Figma 199:104) */}
        <section className="profile-delete-banner" aria-labelledby="delete-banner-heading">
          <div className="profile-delete-banner-text">
            <h2 id="delete-banner-heading" className="profile-delete-banner-title">
              Delete account
            </h2>
            <p className="profile-delete-banner-desc">
              Permanently delete your Matchwise account, uploaded CV, profile and saved matches. This action cannot be undone.
            </p>
          </div>
          <button
            type="button"
            className="profile-delete-banner-btn"
            onClick={() => setIsDeleteModalOpen(true)}
            data-testid="open-delete-account-modal-btn"
          >
            Delete account
          </button>
        </section>
      </main>

      {/* Modals */}
      <VerifyPhoneModal
        isOpen={isVerifyPhoneOpen}
        onClose={() => setIsVerifyPhoneOpen(false)}
        onVerified={handlePhoneVerified}
        phoneNumber={profileData.phone}
      />

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
