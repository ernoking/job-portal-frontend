import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { ArrowLeft, CheckIcon } from './Icons';
import './AuthLayout.css';

export default function AuthLayout({
  pageType = 'login', // 'login' | 'register'
  eyebrowText,
  headingText,
  paragraphText,
  leftFooterLabel,
  leftFooterRight,
  leftCardContent,
  pillText,
  h1Content,
  subContent,
  children,
}) {
  const isRegister = pageType === 'register';

  return (
    <div className={`auth-page ${isRegister ? 'auth-register' : 'auth-login'}`}>
      {/* LEFT COLUMN */}
      <section className="auth-left-panel">
        {/* Background decorative concentric circles */}
        <div className={`auth-concentric-circles ${isRegister ? 'circles-register' : 'circles-login'}`} aria-hidden="true">
          <div className="concentric-circle circle-800" />
          <div className="concentric-circle circle-650" />
          <div className="concentric-circle circle-500" />
        </div>

        {/* Bottom-left decorative quarter circle */}
        <div className="auth-corner-circle" aria-hidden="true" />

        {/* Top Logo */}
        <header className="auth-left-header">
          <Logo variant="dark" size="large" to="/" />
        </header>

        {/* Vertically centered left content */}
        <div className="auth-left-content">
          <div className="auth-eyebrow">
            <span className="auth-eyebrow-ring">
              <span className="auth-eyebrow-dot" />
            </span>
            <span className="auth-eyebrow-text">{eyebrowText}</span>
          </div>

          <h2 className="auth-left-heading">{headingText}</h2>

          <p className="auth-left-paragraph">{paragraphText}</p>

          <div className="auth-left-interactive">{leftCardContent}</div>
        </div>

        {/* Left Footer */}
        <footer className="auth-left-footer">
          <div className="auth-footer-divider" />
          <div className="auth-footer-row">
            <span className="auth-footer-badge">{leftFooterLabel}</span>
            <span className="auth-footer-note">{leftFooterRight}</span>
          </div>
        </footer>
      </section>

      {/* RIGHT COLUMN */}
      <main className="auth-right-panel">
        {/* Top Back link */}
        <div className="auth-back-nav">
          <Link to="/" className="auth-back-link">
            <ArrowLeft size={12} stroke={2} color="currentColor" />
            <span>Back to home</span>
          </Link>
        </div>

        {/* Centered Form Container (460px) */}
        <div className="auth-form-column">
          <div className="auth-form-header">
            {pillText && (
              <div className="auth-pill-wrap">
                <div className="pill">
                  <span className="pill-dot" />
                  <span className="pill-text">{pillText}</span>
                </div>
              </div>
            )}
            <h1 className="auth-h1">{h1Content}</h1>
            <p className="auth-sub">{subContent}</p>
          </div>

          <div className="auth-form-body">{children}</div>

          {/* Secure Note */}
          <div className="auth-secure-note">
            <div className="auth-secure-divider" />
            <div className="auth-secure-content">
              <span className="auth-secure-icon">
                <CheckIcon size={16} stroke={2.5} color="var(--olive)" />
              </span>
              <span className="auth-secure-text">Your CV and personal data stay private and secure.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
