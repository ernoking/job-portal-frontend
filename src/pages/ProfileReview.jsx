import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from '../components/profile/AppHeader';
import ProfileSection from '../components/profile/ProfileSection';
import InfoGrid from '../components/profile/InfoGrid';
import AccordionRow from '../components/profile/AccordionRow';
import SkillChip from '../components/profile/SkillChip';
import LanguageRow from '../components/profile/LanguageRow';
import ActionBar from '../components/profile/ActionBar';
import { getProfile, confirmProfile } from '../api/profile';
import './ProfileReview.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfileReview() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [parseError, setParseError] = useState(null);

  // Profile data in local state
  const [profile, setProfile] = useState(null);

  // Editing state for Section 1 (Personal)
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [editPersonalData, setEditPersonalData] = useState({});
  const [personalErrors, setPersonalErrors] = useState({});

  // Editing state for Section 2 (Career)
  const [isEditingCareer, setIsEditingCareer] = useState(false);
  const [editCareerData, setEditCareerData] = useState({});

  // Adding skill state
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillValue, setNewSkillValue] = useState('');

  // Adding language state
  const [newLanguages, setNewLanguages] = useState([]);

  // Submitting / confirm state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let isMounted = true;
    getProfile()
      .then((data) => {
        if (isMounted) {
          if (!data || !data.personal) {
            setParseError("We couldn't read your CV. Please upload it again.");
          } else {
            setProfile(data);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setParseError("We couldn't read your CV. Please upload it again.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Personal section handlers
  const handleStartEditPersonal = () => {
    setEditPersonalData({ ...profile.personal });
    setPersonalErrors({});
    setIsEditingPersonal(true);
  };

  const handleCancelEditPersonal = () => {
    setIsEditingPersonal(false);
    setPersonalErrors({});
  };

  const handleSavePersonal = () => {
    if (editPersonalData.email && !EMAIL_REGEX.test(editPersonalData.email)) {
      setPersonalErrors({ email: 'Please enter a valid email address.' });
      return;
    }
    setProfile((prev) => ({
      ...prev,
      personal: { ...editPersonalData },
    }));
    setIsEditingPersonal(false);
    setPersonalErrors({});
  };

  const handlePersonalChange = (key, value) => {
    setEditPersonalData((prev) => ({ ...prev, [key]: value }));
    if (personalErrors[key]) {
      setPersonalErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  // Career section handlers
  const handleStartEditCareer = () => {
    setEditCareerData({ ...profile.career });
    setIsEditingCareer(true);
  };

  const handleCancelEditCareer = () => {
    setIsEditingCareer(false);
  };

  const handleSaveCareer = () => {
    setProfile((prev) => ({
      ...prev,
      career: { ...editCareerData },
    }));
    setIsEditingCareer(false);
  };

  const handleCareerChange = (key, value) => {
    setEditCareerData((prev) => ({ ...prev, [key]: value }));
  };

  // Skill handlers
  const handleRemoveSkill = (skillToRemove) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleStartAddSkill = () => {
    setIsAddingSkill(true);
    setNewSkillValue('');
  };

  const handleAddSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = newSkillValue.trim();
      if (
        trimmed &&
        !profile.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())
      ) {
        setProfile((prev) => ({
          ...prev,
          skills: [...prev.skills, trimmed],
        }));
      }
      setIsAddingSkill(false);
      setNewSkillValue('');
    } else if (e.key === 'Escape') {
      setIsAddingSkill(false);
      setNewSkillValue('');
    }
  };

  const handleAddSkillBlur = () => {
    const trimmed = newSkillValue.trim();
    if (
      trimmed &&
      !profile.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())
    ) {
      setProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmed],
      }));
    }
    setIsAddingSkill(false);
    setNewSkillValue('');
  };

  // Language handlers
  const handleLanguageLevelChange = (id, newLevel) => {
    // Check if it's in existing profile
    setProfile((prev) => ({
      ...prev,
      languages: prev.languages.map((l) =>
        l.id === id ? { ...l, level: newLevel } : l
      ),
    }));
    // Check if it's in newLanguages
    setNewLanguages((prev) =>
      prev.map((l) => (l.id === id ? { ...l, level: newLevel } : l))
    );
  };

  const handleStartAddLanguage = () => {
    const newId = `new-lang-${Date.now()}`;
    setNewLanguages((prev) => [
      ...prev,
      { id: newId, language: '', level: 'B1' },
    ]);
  };

  const handleNewLanguageNameChange = (id, value) => {
    setNewLanguages((prev) =>
      prev.map((l) => (l.id === id ? { ...l, language: value } : l))
    );
  };

  const handleNewLanguageBlur = (id) => {
    const langObj = newLanguages.find((l) => l.id === id);
    if (!langObj) return;
    const trimmed = langObj.language.trim();
    if (trimmed) {
      setProfile((prev) => ({
        ...prev,
        languages: [
          ...prev.languages,
          { id: langObj.id, language: trimmed, level: langObj.level },
        ],
      }));
    }
    // Remove from temporary list
    setNewLanguages((prev) => prev.filter((l) => l.id !== id));
  };

  // Confirm profile handler
  const handleConfirm = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await confirmProfile(profile);
      if (res && res.success !== false) {
        navigate('/matches');
      } else {
        setSubmitError('Failed to confirm profile. Please try again.');
        setIsSubmitting(false);
      }
    } catch {
      setSubmitError('Failed to confirm profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  const personalItems = [
    { key: 'name', label: 'NAME', placeholder: 'Your full name' },
    { key: 'email', label: 'EMAIL', type: 'email', placeholder: 'your.email@example.com' },
    { key: 'location', label: 'LOCATION', placeholder: 'City, Country' },
  ];

  const careerItems = [
    { key: 'targetRoles', label: 'TARGET ROLES', placeholder: 'e.g. Product Designer' },
    { key: 'workType', label: 'WORK TYPE', placeholder: 'e.g. Remote, Hybrid' },
    { key: 'seniority', label: 'SENIORITY', placeholder: 'e.g. Mid–level' },
  ];

  return (
    <div className="profile-review-page">
      <AppHeader />

      <main className="profile-review-main">
        <div className="profile-review-column">
          {/* Back link */}
          <div className="profile-back-row">
            <Link
              to="/upload"
              className="profile-back-link"
              data-testid="back-to-previous-btn"
            >
              <svg
                className="profile-back-arrow"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
              <span>Go back to previous step</span>
            </Link>
          </div>

          {/* Title block */}
          <div className="profile-title-block">
            <div className="profile-check-tile" aria-hidden="true">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#17332A"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="profile-title-content">
              <h1 className="profile-heading">Your profile is ready.</h1>
              <p className="profile-subtitle">
                Everything parsed successfully. Give it one final check before viewing your matches.
              </p>
            </div>
          </div>

          {/* Main Card */}
          <div className="profile-card" data-testid="profile-card">
            {loading ? (
              <div className="profile-loading-state" data-testid="profile-loading">
                <p className="profile-loading-text">Loading your profile...</p>
                <div className="profile-skeleton-bar" style={{ width: '60%' }} />
                <div className="profile-skeleton-bar" style={{ width: '80%' }} />
                <div className="profile-skeleton-bar" style={{ width: '70%' }} />
                <div className="profile-skeleton-bar" style={{ width: '50%' }} />
              </div>
            ) : parseError ? (
              <div className="profile-error-state" data-testid="profile-parse-error">
                <p className="profile-error-text">{parseError}</p>
                <Link to="/upload" className="profile-reupload-btn" data-testid="reupload-cv-btn">
                  Reupload CV
                </Link>
              </div>
            ) : (
              <>
                {/* Section 1: Personal information */}
                <ProfileSection
                  id="personal"
                  title="Personal information"
                  action={{ label: 'Edit', onClick: handleStartEditPersonal }}
                  isEditing={isEditingPersonal}
                  onSave={handleSavePersonal}
                  onCancel={handleCancelEditPersonal}
                  hasDivider={true}
                  testId="profile-section-personal"
                  editTestId="edit-personal-btn"
                >
                  <InfoGrid
                    items={personalItems}
                    values={isEditingPersonal ? editPersonalData : profile.personal}
                    isEditing={isEditingPersonal}
                    onChange={handlePersonalChange}
                    errors={personalErrors}
                  />
                </ProfileSection>

                {/* Section 2: Career goals & preferences */}
                <ProfileSection
                  id="career"
                  title="Career goals & preferences"
                  action={{ label: 'Edit', onClick: handleStartEditCareer }}
                  isEditing={isEditingCareer}
                  onSave={handleSaveCareer}
                  onCancel={handleCancelEditCareer}
                  hasDivider={true}
                  testId="profile-section-career"
                  editTestId="edit-career-btn"
                >
                  <InfoGrid
                    items={careerItems}
                    values={isEditingCareer ? editCareerData : profile.career}
                    isEditing={isEditingCareer}
                    onChange={handleCareerChange}
                  />
                </ProfileSection>

                {/* Section 3: Experience & education */}
                <ProfileSection
                  id="experience"
                  title="Experience & education"
                  hasDivider={true}
                  testId="profile-section-experience"
                >
                  <div className="profile-accordion-list">
                    {profile.experienceEducation.map((item) => (
                      <AccordionRow key={item.id} item={item} />
                    ))}
                  </div>
                </ProfileSection>

                {/* Section 4: Extracted skills */}
                <ProfileSection
                  id="skills"
                  title="Extracted skills"
                  action={{ label: '+ Add skill', onClick: handleStartAddSkill }}
                  hasDivider={true}
                  testId="profile-section-skills"
                  editTestId="add-skill-btn"
                >
                  <div className="profile-skills-row">
                    {profile.skills.map((skill) => (
                      <SkillChip
                        key={skill}
                        skill={skill}
                        onRemove={handleRemoveSkill}
                      />
                    ))}
                    {isAddingSkill && (
                      <input
                        type="text"
                        className="profile-skill-input-new"
                        value={newSkillValue}
                        onChange={(e) => setNewSkillValue(e.target.value)}
                        onKeyDown={handleAddSkillKeyDown}
                        onBlur={handleAddSkillBlur}
                        placeholder="Add skill"
                        autoFocus
                        data-testid="input-new-skill"
                      />
                    )}
                  </div>
                </ProfileSection>

                {/* Section 5: Languages */}
                <ProfileSection
                  id="languages"
                  title="Languages"
                  action={{ label: '+ Add language', onClick: handleStartAddLanguage }}
                  hasDivider={false}
                  testId="profile-section-languages"
                  editTestId="add-language-btn"
                >
                  <div className="profile-languages-grid">
                    {profile.languages.map((lang) => (
                      <LanguageRow
                        key={lang.id}
                        id={lang.id}
                        language={lang.language}
                        level={lang.level}
                        onLevelChange={handleLanguageLevelChange}
                      />
                    ))}
                    {newLanguages.map((lang) => (
                      <LanguageRow
                        key={lang.id}
                        id={lang.id}
                        language={lang.language}
                        level={lang.level}
                        isNew={true}
                        onNameChange={handleNewLanguageNameChange}
                        onLevelChange={handleLanguageLevelChange}
                        onBlurNew={handleNewLanguageBlur}
                      />
                    ))}
                  </div>
                </ProfileSection>
              </>
            )}
          </div>

          {/* Action Bar */}
          {!loading && !parseError && (
            <div className="profile-action-bar-wrapper">
              <ActionBar
                onConfirm={handleConfirm}
                isSubmitting={isSubmitting}
                errorMessage={submitError}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
