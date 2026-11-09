import React from 'react';
import AppHeader from '../profile/AppHeader';
import Stepper from './Stepper';
import './OnboardingLayout.css';

export default function OnboardingLayout({
  step = 1,
  stepTitle = 'Resume upload',
  pillWidth,
  rightInset = 95,
  darkPanel,
  whitePanel,
  whitePanelHeight,
  testId = 'onboarding-layout',
}) {
  const whiteCardStyle = whitePanelHeight
    ? { height: `${whitePanelHeight}px` }
    : undefined;

  return (
    <div className={`onboarding-page onboarding-step-${step}`}>
      <AppHeader
        step={step}
        total={3}
        stepTitle={stepTitle}
        pillWidth={pillWidth}
        rightInset={rightInset}
      />

      <main className="onboarding-main">
        <div className="onboarding-stepper-wrap">
          <Stepper currentStep={step} />
        </div>

        <div className="onboarding-block" data-testid={testId}>
          {darkPanel}
          <div
            className="onboarding-white-card"
            style={whiteCardStyle}
            data-testid="onboarding-white-card"
          >
            {whitePanel}
          </div>
        </div>
      </main>
    </div>
  );
}
