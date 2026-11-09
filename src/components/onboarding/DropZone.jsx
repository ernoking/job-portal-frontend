import React, { useRef, useState } from 'react';
import { validateCvFile } from '../../utils/validateCvFile';
import './DropZone.css';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function DropZone({ file, onFileSelect, errorMessage }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const validateAndSelect = (selectedFile) => {
    if (!selectedFile) return;

    const result = validateCvFile(selectedFile);
    if (!result.ok) {
      onFileSelect(null, result.message);
      return;
    }

    onFileSelect(selectedFile, null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  return (
    <div
      className={`dropzone ${isDragOver ? 'is-drag-over' : ''} ${file ? 'has-file' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      tabIndex={0}
      role="region"
      aria-label="Resume upload drop zone"
      aria-describedby="dropzone-format-text"
      onKeyDown={handleKeyDown}
      data-testid="drop-zone"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        className="dropzone-file-input"
        onChange={handleFileChange}
        tabIndex={-1}
        data-testid="cv-file-input"
      />

      <div className="dropzone-icon-tile" aria-hidden="true">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#17332A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19V5" />
          <path d="m5 12 7-7 7 7" />
        </svg>
      </div>

      <div className="dropzone-text-group">
        <p className="dropzone-title">
          {file ? file.name : 'Drag and drop your resume here'}
        </p>
        <p id="dropzone-format-text" className="dropzone-subtitle">
          {file ? formatBytes(file.size) : 'Supports PDF, DOCX · Max 5MB'}
        </p>
        {errorMessage && (
          <p className="dropzone-error-msg" role="alert" data-testid="dropzone-error">
            {errorMessage}
          </p>
        )}
      </div>

      <button
        type="button"
        className="dropzone-browse-btn"
        onClick={handleButtonClick}
        data-testid="browse-files-btn"
      >
        {file ? 'Replace file' : 'Browse files'}
      </button>
    </div>
  );
}
