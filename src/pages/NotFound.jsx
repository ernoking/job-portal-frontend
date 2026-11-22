import React from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import Button from '../components/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        backgroundColor: 'var(--page, #F8F9F7)',
        fontFamily: 'var(--font-family, "DM Sans", sans-serif)',
      }}
    >
      <title>Page Not Found — Matchwise</title>
      <meta name="robots" content="noindex, nofollow" />

      <div style={{ marginBottom: '32px' }}>
        <BrandLogo variant="light" size="normal" to="/" />
      </div>

      <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#17332A', margin: '0 0 12px 0' }}>
        404
      </h1>
      <p style={{ fontSize: '18px', color: '#4A5D56', maxWidth: '420px', margin: '0 0 28px 0' }}>
        The page you are looking for doesn’t exist or has been moved.
      </p>

      <Button variant="dark" onClick={() => navigate('/')}>
        Back to homepage
      </Button>
    </div>
  );
}