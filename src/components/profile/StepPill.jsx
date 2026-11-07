import React from 'react';
import './StepPill.css';

export default function StepPill({ step = 3, total = 3, title = 'Profile review' }) {
  return (
    <div className="step-pill" data-testid="step-pill">
      <span className="step-pill-full">Step {step} of {total} · {title}</span>
      <span className="step-pill-short">Step {step} of {total}</span>
    </div>
  );
}
