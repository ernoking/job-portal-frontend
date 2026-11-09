import React, { useState, useRef, useEffect } from 'react';
import './TagInput.css';

export default function TagInput({ tags = [], onAddTag, onRemoveTag }) {
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitTag();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setInputValue('');
    }
  };

  const commitTag = () => {
    const trimmed = inputValue.trim();
    if (
      trimmed &&
      !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())
    ) {
      onAddTag(trimmed);
    }
    setIsAdding(false);
    setInputValue('');
  };

  return (
    <div className="tag-input-container" data-testid="tag-input-container">
      <div className="tag-input-list">
        {tags.map((tag) => {
          const safeId = tag.toLowerCase().replace(/\s+/g, '-');
          return (
            <div key={tag} className="role-tag" data-testid={`tag-${safeId}`}>
              <span className="role-tag-text">{tag}</span>
              <button
                type="button"
                className="role-tag-remove"
                onClick={() => onRemoveTag(tag)}
                aria-label={`Remove ${tag}`}
                data-testid={`tag-remove-${safeId}`}
              >
                <span aria-hidden="true" className="role-tag-x">×</span>
              </button>
            </div>
          );
        })}

        {isAdding ? (
          <input
            ref={inputRef}
            type="text"
            className="role-tag-new-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitTag}
            placeholder="Add role"
            data-testid="input-new-role"
          />
        ) : null}
      </div>

      <button
        type="button"
        className="tag-add-btn"
        onClick={() => setIsAdding(true)}
        aria-label="Add job role"
        data-testid="add-role-btn"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#7A857E"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
