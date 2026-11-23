import React, { useState, useEffect } from 'react';
import './AiRateLimitBanner.css';

/**
 * Banner component to notify users of AI rate limits or service unavailability (AJSP-16, AJSP-77, AJSP-17, AJSP-79).
 * Features:
 * - Friendly message indicating limit reached or outage.
 * - Dynamic countdown timer if retryAfter or resetsAt is provided.
 * - "Retry now" action button enabled when countdown reaches 0 or immediately.
 * - Dismiss / Close option.
 */
export default function AiRateLimitBanner({
  error,
  onRetry,
  onDismiss,
  customMessage,
  retryAfterSeconds,
}) {
  const [countdown, setCountdown] = useState(() => {
    if (typeof error?.data?.retryAfterSeconds === 'number') return error.data.retryAfterSeconds;
    if (typeof error?.retryAfterSeconds === 'number') return error.retryAfterSeconds;
    if (error?.data?.usage?.resetsAt || error?.usage?.resetsAt) {
      const resetTime = Date.parse(error?.data?.usage?.resetsAt || error?.usage?.resetsAt);
      if (!Number.isNaN(resetTime)) {
        return Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
      }
    }
    if (typeof error?.data?.retryAfter === 'number') return error.data.retryAfter;
    if (typeof retryAfterSeconds === 'number') return retryAfterSeconds;
    return 60;
  });
  const [canRetry, setCanRetry] = useState(() => countdown <= 0);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanRetry(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleRetryClick = () => {
    if (onRetry) {
      setCanRetry(false);
      setCountdown(retryAfterSeconds || 60);
      onRetry();
    }
  };

  const isRateLimit = error?.status === 429 || error?.message?.toLowerCase().includes('limit');
  const title = isRateLimit ? 'AI usage limit reached' : 'AI service temporarily unavailable';
  const defaultDesc = isRateLimit
    ? 'You have reached your allocated AI generation quota for this period. You can retry once the cool-down expires.'
    : 'The AI generation provider is experiencing high traffic. Please try again shortly.';

  const message = customMessage || error?.message || defaultDesc;

  return (
    <div className={`ai-limit-banner ${isRateLimit ? 'is-rate-limit' : 'is-unavailable'}`} role="alert" data-testid="ai-rate-limit-banner">
      <div className="ai-limit-icon" aria-hidden="true">
        {isRateLimit ? '⏳' : '⚠️'}
      </div>
      <div className="ai-limit-content">
        <h4 className="ai-limit-title">{title}</h4>
        <p className="ai-limit-desc">{message}</p>
        
        <div className="ai-limit-actions">
          {onRetry && (
            <button
              type="button"
              className={`ai-limit-retry-btn ${canRetry ? 'is-ready' : 'is-disabled'}`}
              disabled={!canRetry}
              onClick={handleRetryClick}
            >
              {canRetry ? 'Retry now' : `Retry in ${countdown}s`}
            </button>
          )}

          {isRateLimit && (
            <button
              type="button"
              className="ai-limit-upgrade-link"
              onClick={() => alert('Upgrade to Premium to get unlimited AI tailoring!')}
            >
              Upgrade to Premium for unlimited AI →
            </button>
          )}
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          className="ai-limit-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          ✕
        </button>
      )}
    </div>
  );
}
