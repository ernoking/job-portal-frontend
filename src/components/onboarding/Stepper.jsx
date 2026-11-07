import React from 'react';
import './Stepper.css';

const STEPS = [
  { id: 1, label: 'Resume' },
  { id: 2, label: 'Preferences' },
  { id: 3, label: 'Profile' },
];

export default function Stepper({ currentStep = 1 }) {
  return (
    <nav aria-label="Onboarding Progress" className="stepper-nav">
      <ol className="stepper" data-testid="stepper">
        {STEPS.map((step, idx) => {
          const isDone = step.id < currentStep;
          const isActive = step.id === currentStep;

          let stateClass = 'is-upcoming';
          if (isDone) stateClass = 'is-done';
          else if (isActive) stateClass = 'is-active';

          return (
            <React.Fragment key={step.id}>
              <li
                className={`stepper-item ${stateClass}`}
                aria-current={isActive ? 'step' : undefined}
                data-testid={`stepper-step-${step.id}`}
              >
                <div className="stepper-circle" aria-hidden="true">
                  {isDone ? (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#17332A"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span className="stepper-number">{step.id}</span>
                  )}
                </div>
                <span className="stepper-label">{step.label}</span>
              </li>

              {idx < STEPS.length - 1 && (
                <li className="stepper-connector" aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
