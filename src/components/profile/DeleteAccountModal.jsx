import { useState, useEffect, useRef, useCallback } from 'react';
import './DeleteAccountModal.css';

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirmDelete,
  isDeleting = false,
}) {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState(null);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => passwordInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (isDeleting) return;
    setPassword('');
    setConfirmText('');
    setError(null);
    onClose();
  }, [isDeleting, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape' && !isDeleting) {
        handleClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, handleClose]);

  if (!isOpen) return null;

  const isDeleteEnabled = password.trim().length > 0 && confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async (e) => {
    if (e) e.preventDefault();
    if (!isDeleteEnabled || isDeleting) return;
    try {
      setError(null);
      await onConfirmDelete(password);
    } catch (err) {
      if (err?.status === 401 || err?.data?.code === 'WRONG_PASSWORD' || err?.message?.includes('password')) {
        setError('Incorrect password. Please enter your valid password to proceed.');
      } else {
        setError(err?.message || 'Failed to delete account. Please try again.');
      }
    }
  };

  return (
    <div
      className="delete-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          handleClose();
        }
      }}
    >
      <form className="delete-modal-card" onSubmit={handleDelete}>
        <div className="delete-modal-icon-badge" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d92d20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </div>

        <h2 id="delete-modal-title" className="delete-modal-title">
          Delete Matchwise account
        </h2>

        <p className="delete-modal-desc">
          Permanently delete your Matchwise account, uploaded CV, profile and saved matches. This action <strong>cannot be undone</strong>.
        </p>

        <div className="delete-modal-field">
          <label htmlFor="delete-account-password-input" className="delete-modal-label">
            Enter your <strong>password</strong>:
          </label>
          <input
            ref={passwordInputRef}
            id="delete-account-password-input"
            type="password"
            className="delete-modal-input"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isDeleting}
            autoComplete="current-password"
            data-testid="delete-account-password-input"
          />
        </div>

        <div className="delete-modal-field">
          <label htmlFor="confirm-delete-input" className="delete-modal-label">
            Type <strong>DELETE</strong> to confirm:
          </label>
          <input
            id="confirm-delete-input"
            type="text"
            className="delete-modal-input"
            placeholder="DELETE"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={isDeleting}
            autoComplete="off"
            data-testid="delete-account-confirm-input"
          />
        </div>

        {error && (
          <p className="delete-modal-error" role="alert">
            {error}
          </p>
        )}

        <div className="delete-modal-actions">
          <button
            type="button"
            className="delete-modal-cancel-btn"
            onClick={handleClose}
            disabled={isDeleting}
            data-testid="delete-account-cancel-btn"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="delete-modal-confirm-btn"
            disabled={!isDeleteEnabled || isDeleting}
            data-testid="delete-account-confirm-btn"
          >
            {isDeleting ? 'Deleting account...' : 'Permanently delete account'}
          </button>
        </div>
      </form>
    </div>
  );
}
