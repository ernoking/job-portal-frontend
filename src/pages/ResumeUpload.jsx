import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import DarkPanel from '../components/onboarding/DarkPanel';
import AnalysisProgress from '../components/onboarding/AnalysisProgress';
import DropZone from '../components/onboarding/DropZone';
import { USE_MOCK_API } from '../api/config';
import { generateCvProfile } from '../api/profile';
import { getDraft, setDraft } from '../onboarding/draftStore';
import { getCvDownloadUrl, listCvFiles, uploadCv } from '../api/cv';
import './ResumeUpload.css';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function ResumeUpload() {
  const navigate = useNavigate();

  const analysisRequest = useRef(null);
  useEffect(() => () => analysisRequest.current?.abort(), []);

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
    if (analysisRequest.current) return;
    setSelectedFile(file);
    if (file) {
      setUploadedCvId(null);
      setDraft({ cvId: null, uploadedFileName: file.name });
    }
    setFileError(error);
    setUploadError('');
  };

  const handleStartAnalysis = async () => {
    if ((!selectedFile && !uploadedCvId) || analysisRequest.current) return;

    const controller = new AbortController();
    analysisRequest.current = controller;
    setIsAnalysing(true);
    setUploadError('');

    try {
      let cvId = uploadedCvId;
      if (!cvId) {
        const result = await uploadCv(selectedFile, { signal: controller.signal });
        if (!result?.success) throw new Error('Failed to upload CV. Please try again.');
        cvId = result.cv?.id;
        if (cvId) {
          setUploadedCvId(cvId);
          setDraft({ cvId, uploadedFileName: selectedFile?.name || result.cv?.fileName });
          setSavedFiles((files) => [result.cv, ...files.filter((file) => file.id !== cvId)]);
        }
      }
      if (!cvId && !USE_MOCK_API) throw new Error('The CV upload could not be confirmed. Please try again.');
      if (cvId) await generateCvProfile(cvId, { signal: controller.signal });
      if (controller.signal.aborted) return;
      navigate('/preferences');
    } catch (err) {
      if (!controller.signal.aborted) {
        setUploadError(err?.message || 'Failed to upload CV. Please try again.');
      }
    } finally {
      analysisRequest.current = null;
      if (!controller.signal.aborted) setIsAnalysing(false);
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
    <div className="resume-right-content" aria-busy={isAnalysing}>
      <div className="resume-right-header">
        <div className="resume-step-badge" aria-hidden="true">01</div>
        <div className="resume-title-group">
          <h2 className="resume-right-title">Add your resume</h2>
          <p className="resume-right-subtitle">One file is all we need to get started.</p>
        </div>
      </div>

      {selectedFile ? (
        <div className="resume-file-card" data-testid="uploaded-file-card">
          <div className="resume-file-icon" aria-hidden="true">
            <span>{selectedFile.name.split('.').pop()?.toUpperCase() || 'PDF'}</span>
          </div>
          <div className="resume-file-details">
            <div className="resume-file-title-row">
              <span className="resume-file-name">{selectedFile.name}</span>
              <span className="resume-file-badge">✓ Uploaded successfully</span>
            </div>
            <span className="resume-file-size">{formatBytes(selectedFile.size)}</span>
          </div>
          <button
            type="button"
            className="resume-file-delete-btn"
            onClick={() => {
              setSelectedFile(null);
              setFileError(null);
              setUploadError('');
            }}
            aria-label="Remove uploaded file"
            data-testid="remove-file-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      ) : (
        <DropZone
          file={null}
          onFileSelect={handleFileSelect}
          errorMessage={fileError}
          disabled={isAnalysing}
        />
      )}

      {(fileError || uploadError) && (
        <div className="resume-error-banner" role="alert" data-testid="upload-error">
          <div className="resume-error-icon" aria-hidden="true">!</div>
          <div className="resume-error-text">{fileError || uploadError}</div>
        </div>
      )}

      {savedFiles.length > 0 && !selectedFile && (
        <div className="resume-saved-cv">
          <label htmlFor="saved-cv">Use a saved CV</label>
          <div className="resume-saved-cv-controls">
            <select
              id="saved-cv"
              disabled={isAnalysing}
              value={uploadedCvId ?? ''}
              onChange={(event) => {
                const cvId = event.target.value || null;
                setUploadedCvId(cvId);
                setSelectedFile(null);
                setDraft({ cvId });
                setUploadError('');
              }}
            >
              <option value="">Select a saved CV</option>
              {savedFiles.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.fileName}
                </option>
              ))}
            </select>
            {uploadedCvId && (
              <button
                type="button"
                disabled={isAnalysing}
                onClick={() => downloadCv(uploadedCvId)}
              >
                Download CV
              </button>
            )}
          </div>
          {uploadedCvId && (
            <p role="status">You can analyse this CV again without re-uploading.</p>
          )}
        </div>
      )}
      {savedFilesError && (
        <p className="resume-upload-error" role="alert">
          {savedFilesError}
        </p>
      )}

      <button
        type="button"
        className={`resume-analyse-btn ${(selectedFile || uploadedCvId) && !isAnalysing ? 'is-enabled' : 'is-disabled'}`}
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
      darkPanel={<DarkPanel height={null} className={isAnalysing ? 'resume-analysis-panel' : ''}>
        {isAnalysing ? <AnalysisProgress uploaded={Boolean(uploadedCvId)} /> : darkPanelContent}
      </DarkPanel>}
      whitePanel={whitePanelContent}
      testId="onboarding-step-1"
    />
  );
}
