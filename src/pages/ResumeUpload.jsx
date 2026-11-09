import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import DarkPanel from '../components/onboarding/DarkPanel';
import DropZone from '../components/onboarding/DropZone';
import { uploadCv } from '../api/cv';
import './ResumeUpload.css';

export default function ResumeUpload() {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileSelect = (file, error) => {
    setSelectedFile(file);
    setFileError(error);
    setUploadError('');
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile || isAnalysing) return;

    setIsAnalysing(true);
    setUploadError('');

    try {
      const res = await uploadCv(selectedFile);
      if (res && res.success !== false) {
        navigate('/preferences');
      } else {
        setUploadError('Failed to upload CV. Please try again.');
        setIsAnalysing(false);
      }
    } catch (err) {
      setUploadError(err?.message || 'Failed to upload CV. Please try again.');
      setIsAnalysing(false);
    }
  };

  const darkPanelContent = (
    <div className="resume-left-content">
      <div className="resume-left-eyebrow">YOUR PROFILE STARTS HERE</div>

      <h1 className="resume-left-heading">
        <span>Upload your</span>
        <span>resume to</span>
        <span>
          start <span className="highlight-lime">AI</span>
        </span>
        <span className="highlight-lime">matching</span>
      </h1>

      <p className="resume-left-desc">
        We’ll instantly extract your skills, education,
        <br />
        and projects to find roles that truly fit.
      </p>

      <ul className="resume-left-checklist" aria-label="Feature checklist">
        <li className="resume-checklist-item">
          <span className="resume-checklist-check" aria-hidden="true">✓</span>
          <span>Your data stays private</span>
        </li>
        <li className="resume-checklist-item">
          <span className="resume-checklist-check" aria-hidden="true">✓</span>
          <span>PDF or DOCX supported</span>
        </li>
        <li className="resume-checklist-item">
          <span className="resume-checklist-check" aria-hidden="true">✓</span>
          <span>Results in under 5 minutes</span>
        </li>
      </ul>
    </div>
  );

  const whitePanelContent = (
    <div className="resume-right-content">
      <div className="resume-right-header">
        <div className="resume-step-badge" aria-hidden="true">01</div>
        <div className="resume-title-group">
          <h2 className="resume-right-title">Add your resume</h2>
          <p className="resume-right-subtitle">One file is all we need to get started.</p>
        </div>
      </div>

      <DropZone
        file={selectedFile}
        onFileSelect={handleFileSelect}
        errorMessage={fileError}
      />

      {uploadError && (
        <div className="resume-upload-error" role="alert" data-testid="upload-error">
          {uploadError}
        </div>
      )}

      <button
        type="button"
        className={`resume-analyse-btn ${selectedFile ? 'is-enabled' : 'is-disabled'}`}
        disabled={!selectedFile || isAnalysing}
        aria-disabled={!selectedFile || isAnalysing}
        onClick={handleStartAnalysis}
        data-testid="start-analysing-btn"
      >
        <span>{isAnalysing ? 'Analysing...' : 'Start analysing CV'}</span>
        <span className="resume-btn-arrow" aria-hidden="true">→</span>
      </button>

      <p className="resume-legal-text">
        Your files are securely handled and processed. By uploading, you agree to our{' '}
        <a href="#" className="resume-legal-link">Terms</a> and{' '}
        <a href="#" className="resume-legal-link">Privacy Policy</a>.
      </p>
    </div>
  );

  return (
    <OnboardingLayout
      step={1}
      stepTitle="Resume upload"
      pillWidth={171}
      rightInset={95}
      whitePanelHeight={620}
      darkPanel={<DarkPanel height={620}>{darkPanelContent}</DarkPanel>}
      whitePanel={whitePanelContent}
      testId="onboarding-step-1"
    />
  );
}
