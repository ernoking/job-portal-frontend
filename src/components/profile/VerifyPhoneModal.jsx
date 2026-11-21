import React, { useState, useEffect, useRef } from 'react';
import './VerifyPhoneModal.css';

export default function VerifyPhoneModal({ isOpen, phone, onClose, onVerified }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(42);
  const [isResendActive, setIsResendActive] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!isOpen) return;

    // Auto focus first input on open
    const timeout = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 50);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setIsResendActive(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (index, value) => {
    // Only accept single numeric char
    const char = value.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError('');

    // Advance to next box if char entered
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const arr = pasted.split('');
      setDigits(arr);
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = () => {
    if (!isResendActive) return;
    setTimer(42);
    setIsResendActive(false);
    setDigits(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const handleVerify = () => {
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }
    onVerified?.(code);
    onClose?.();
  };

  // Mask phone for privacy display
  const displayPhone = phone
    ? phone.replace(/(\+\d{2}\s?\d{2})\s?(\d{3})\s?(\d{4})/, '$1 ••• $3')
    : '+36 30 ••• 4567';

  return (
    <div className="verify-phone-overlay" role="dialog" aria-modal="true" aria-labelledby="verify-phone-title">
      <div className="verify-phone-backdrop" onClick={onClose} />
      <div className="verify-phone-dialog" data-node-id="297:306">
        <div className="verify-phone-header">
          <h2 id="verify-phone-title" className="verify-phone-title">
            Verify your phone number
          </h2>
          <button
            type="button"
            className="verify-phone-close"
            onClick={onClose}
            aria-label="Close verification dialog"
          >
            ×
          </button>
        </div>

        <p className="verify-phone-description">
          We sent a 6-digit code by SMS to {displayPhone}. Enter it below to confirm your number.
        </p>

        <div className="verify-phone-inputs" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`verify-phone-digit ${digit ? 'has-value' : ''}`}
              aria-label={`Digit ${idx + 1}`}
            />
          ))}
        </div>

        {error && <p className="verify-phone-error">{error}</p>}

        <div className="verify-phone-resend-row">
          <span className="verify-phone-resend-label">Didn't get a code?</span>
          <button
            type="button"
            className={`verify-phone-resend-btn ${isResendActive ? 'is-active' : ''}`}
            onClick={handleResend}
            disabled={!isResendActive}
          >
            Resend code
          </button>
          {!isResendActive && (
            <span className="verify-phone-timer">
              · available in 0:{timer < 10 ? `0${timer}` : timer}
            </span>
          )}
        </div>

        <div className="verify-phone-actions">
          <button
            type="button"
            className="verify-phone-btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="verify-phone-btn-verify"
            onClick={handleVerify}
          >
            Verify number
          </button>
        </div>
      </div>
    </div>
  );
}
