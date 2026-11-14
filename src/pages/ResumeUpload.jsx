import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import DarkPanel from '../components/onboarding/DarkPanel';
import DropZone from '../components/onboarding/DropZone';
import { generateCvProfile } from '../api/profile';
import { getDraft, setDraft } from '../onboarding/draftStore';
import { getCvDownloadUrl, listCvFiles, uploadCv } from '../api/cv';
import './ResumeUpload.css';

export default function ResumeUpload() {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedCvId, setUploadedCvId] = useState(() => getDraft().cvId);
  const [fileError, setFileError] = useState(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [savedFiles, setSavedFiles] = useState([]);
  const [savedFilesError, setSavedFilesError] = useState('');

  useEffect(() => {
    let active = true;
    listCvFiles().then((files) => {
      if (active) setSavedFiles(files);
    }).catch(() => {
      if (active) setSavedFilesError('Could not load saved CVs.');
    });
    return () => { active = false; };
  }, []);

  const downloadCv = async (id) => {
    try {
      window.location.assign(await getCvDownloadUrl(id));
    } catch (error) {
      setSavedFilesError(error.message);
    }
  };

  const handleFileSelect = (file, error) => {
    setSelectedFile(file);
    if (file) {
      setUploadedCvId(null);
      setDraft({ cvId: null });
    }
    setFileError(error);
    setUploadError('');
  };

  const handleStartAnalysis = async () => {
    if ((!selectedFile && !uploadedCvId) || isAnalysing) return;

    setIsAnalysing(true);
    setUploadError('');

    try {
      let cvId = uploadedCvId;
      if (!cvId) {
        const result = await uploadCv(selectedFile);
        if (!result?.success) throw new Error('Failed to upload CV. Please try again.');
        cvId = result.cv?.id;
        if (cvId) {
          setUploadedCvId(cvId);
          setDraft({ cvId });
          setSavedFiles((files) => [result.cv, ...files.filter((file) => file.id !== cvId)]);
        }
      }
      if (cvId) await generateCvProfile(cvId);
      navigate('/preferences');
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

      {savedFiles.length > 0 && (
        <div className="resume-saved-cv">
          <label htmlFor="saved-cv">Use a saved CV</label>
          <div className="resume-saved-cv-controls">
            <select id="saved-cv" disabled={isAnalysing} value={uploadedCvId ?? ''} onChange={(event) => {
              const cvId = event.target.value || null;
              setUploadedCvId(cvId);
              setSelectedFile(null);
              setDraft({ cvId });
              setUploadError('');
            }}>
              <option value="">Select a saved CV</option>
              {savedFiles.map((file) => <option key={file.id} value={file.id}>{file.fileName}</option>)}
            </select>
            {uploadedCvId && <button type="button" onClick={() => downloadCv(uploadedCvId)}>Download CV</button>}
          </div>
          {uploadedCvId && <p role="status">You can analyse this CV again without re-uploading.</p>}
        </div>
      )}
      {savedFilesError && <p className="resume-upload-error" role="alert">{savedFilesError}</p>}

      {uploadError && (
        <div className="resume-upload-error" role="alert" data-testid="upload-error">
          {uploadError}
        </div>
      )}

      <button
        type="button"
        className={`resume-analyse-btn ${(selectedFile || uploadedCvId) ? 'is-enabled' : 'is-disabled'}`}
        disabled={(!selectedFile && !uploadedCvId) || isAnalysing}
        aria-disabled={(!selectedFile && !uploadedCvId) || isAnalysing}
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
      darkPanel={<DarkPanel height={null}>{darkPanelContent}</DarkPanel>}
      whitePanel={whitePanelContent}
      testId="onboarding-step-1"
    />
  );
}
