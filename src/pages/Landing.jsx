import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Pill from '../components/Pill';
import Button from '../components/Button';
import MatchCard from '../components/MatchCard';
import FloatingBadge from '../components/FloatingBadge';
import { ArrowUp, SparkleIcon, ConcentricCirclesIcon, CheckIcon } from '../components/Icons';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const stageRef = useRef(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const updateScale = () => {
      const width = el.offsetWidth;
      if (width > 0 && window.innerWidth <= 600) {
        const scale = width / 390;
        el.style.setProperty('--s', String(scale));
      } else {
        el.style.removeProperty('--s');
      }
    };

    updateScale();
    const observer = new ResizeObserver(() => {
      updateScale();
    });
    observer.observe(el);

    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const handleScrollToWhy = (e) => {
    e.preventDefault();
    const el = document.getElementById('why-matchwise');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToFeatures = (e) => {
    e.preventDefault();
    const el = document.getElementById('features-hero');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      {/* ====================================================================
          HEADER
          ==================================================================== */}
      <header className="landing-header">
        <div className="header-inner">
          <div className="header-logo">
            <Logo variant="light" size="normal" to="/" />
          </div>

          <nav className="header-nav" aria-label="Main Navigation">
            <a href="#features" onClick={handleScrollToFeatures} className="nav-link">
              Features
            </a>
            <a href="#why-matchwise" onClick={handleScrollToWhy} className="nav-link">
              Why Matchwise
            </a>
          </nav>

          <div className="header-actions">
            <Link to="/login" className="login-nav-link">
              Log in
            </Link>
            <Button
              variant="dark"
              onClick={() => navigate('/register')}
              className="header-get-started"
            >
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* ====================================================================
          HERO SECTION
          ==================================================================== */}
      <main id="features-hero" className="landing-hero-section">
        {/* Left Column: Copy & Tiles */}
        <div className="hero-left-col">
          <div className="hero-pill-wrap">
            <Pill>AI-POWERED JOB MATCHING IN 5 MINUTES</Pill>
          </div>

          <h1 className="hero-h1">
            <span className="hero-h1-dark">Stop searching.</span>
            <span className="hero-h1-green">Start matching.</span>
          </h1>

          <div className="hero-btn-wrap">
            <Button
              variant="primary"
              arrow
              onClick={() => navigate('/register')}
              className="hero-find-btn"
            >
              Find my matches
            </Button>
          </div>

          {/* Three Feature Tiles */}
          <div className="hero-tiles-list">
            <div className="hero-tile-row">
              <div className="hero-tile tile-lime">
                <ArrowUp size={24} stroke={2} color="#17332A" />
              </div>
              <span className="tile-label">Upload your CV</span>
            </div>

            <div className="hero-tile-row">
              <div className="hero-tile tile-mint">
                <SparkleIcon size={22} color="#17332A" />
              </div>
              <span className="tile-label">See your best matches</span>
            </div>

            <div className="hero-tile-row">
              <div className="hero-tile tile-lavender">
                <ConcentricCirclesIcon size={22} color="#17332A" stroke={2} />
              </div>
              <span className="tile-label">Apply with confidence</span>
            </div>
          </div>
        </div>

        {/* Right Column: Stacked Match-Cards Composition */}
        <div ref={stageRef} className="hero-right-col" aria-hidden="true">
          <div className="hero-stage-canvas">
            {/* Pale lime background disc */}
            <div className="hero-backdrop-disc" aria-hidden="true" />

            {/* Floating Badge 1 (Top Left) */}
            <FloatingBadge
              title="Grad opportunity"
              subtitle="No experience required"
              iconType="grad"
              className="f-badge badge-top-left"
            />

            {/* Floating Badge 2 (Top Right) */}
            <FloatingBadge
              title="Meets comp target"
              subtitle="Top 5% candidate"
              iconType="sparkle"
              className="f-badge badge-top-right"
            />

            {/* Floating Badge 3 (Mid Left) */}
            <FloatingBadge
              title="12 entry-level matches"
              subtitle="Found today"
              iconType="dot"
              className="f-badge badge-mid-left"
            />

            {/* Floating Badge 4 (Bottom Right) */}
            <FloatingBadge
              title={
                <>
                  <span className="badge-desktop-text">Pivot mode active</span>
                  <span className="badge-mobile-text">Incognito mode active</span>
                </>
              }
              subtitle="8 transferable skills"
              iconType="dot"
              className="f-badge badge-bottom-right"
            />

            {/* Card A (Back Left) */}
            <div className="card-wrapper card-a-wrap">
              <MatchCard
                cardKey="A"
                company="PixelCraft Studio"
                title="Junior Marketing Associate"
                meta="Budapest · Hybrid · Entry-level"
                score={80}
                logoType="pixelcraft"
                whyItems={[
                  'Marketing major coursework',
                  'Content creation',
                  'Collaborative team projects',
                ]}
                buildItems={['SEO optimization', 'Google Analytics']}
              />
            </div>

            {/* Card B (Back Right with 3D Tilt) */}
            <div className="card-wrapper card-b-wrap">
              <MatchCard
                cardKey="B"
                company="Apex Analytics"
                title="Senior Product Manager"
                meta="Debrecen · Remote · Full-time"
                score={92}
                logoType="apex"
                whyItems={[
                  '8+ years Agile leadership',
                  'Product lifecycle & roadmap',
                  'B2B SaaS scaling',
                ]}
                buildItems={['AI model specification', 'SQL & analytics']}
              />
            </div>

            {/* Card C (Front Card, on top of A & B) */}
            <div className="card-wrapper card-c-wrap">
              <MatchCard
                cardKey="C"
                company="Orbit SaaS"
                title="UX Designer"
                meta="Szeged · Hybrid · Full-time"
                score={92}
                logoType="orbit"
                isFront
                whyItems={[
                  'Visual design (Transferable)',
                  'Client collaboration',
                  'Creative problem-solving',
                ]}
                buildItems={['UX research methods', 'Interactive prototyping']}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ====================================================================
          DARK SECTION ("Know why every job fits.")
          ==================================================================== */}
      <section id="why-matchwise" className="landing-dark-section">
        <div className="dark-inner">
          <div className="dark-left-col">
            <span className="dark-eyebrow">MATCH EXPLANATIONS, NOT GUESSES</span>
            <h2 className="dark-h2">Know why every job fits.</h2>
            <p className="dark-paragraph">
              Matchwise compares your real experience with<br className="mobile-only-br" /> every role, then gives<br />
              you an honest, easy-to-understand fit score.
            </p>

            <ul className="dark-checklist">
              <li className="dark-check-item">
                <span className="dark-check-circle">
                  <CheckIcon size={11} stroke={3} color="#17332A" />
                </span>
                <span>See matching skills at a glance</span>
              </li>
              <li className="dark-check-item">
                <span className="dark-check-circle">
                  <CheckIcon size={11} stroke={3} color="#17332A" />
                </span>
                <span>Discover skill gaps worth building</span>
              </li>
              <li className="dark-check-item">
                <span className="dark-check-circle">
                  <CheckIcon size={11} stroke={3} color="#17332A" />
                </span>
                <span>Track every application in one place</span>
              </li>
            </ul>
          </div>

          <div className="dark-right-col">
            <div className="match-quality-card">
              <span className="quality-label">YOUR MATCH QUALITY</span>
              <div className="quality-score">92%</div>
              <div className="quality-bar-track">
                <div className="quality-bar-fill" style={{ width: '92%' }} />
              </div>
              <p className="quality-caption">
                Excellent fit – your background aligns strongly with this<br className="mobile-only-br" /> role.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          FOOTER
          ==================================================================== */}
      <footer className="landing-footer">
        <div className="footer-line" />
        <div className="footer-inner">
          <div className="footer-logo">
            <Logo variant="light" size="normal" to="/" />
          </div>

          <p className="footer-center-text">
            Matchwise helps job seekers spend less time searching<br className="mobile-only-br" /> and more time<br />
            moving forward.
          </p>

          <div className="footer-action">
            <Button
              variant="dark"
              onClick={() => navigate('/register')}
              className="footer-btn"
            >
              Create free account
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
