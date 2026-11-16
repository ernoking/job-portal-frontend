import React from 'react';
import BrandLogo from '../components/BrandLogo';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--page)',
      gap: '24px',
      padding: '40px',
      textAlign: 'center',
    }}>
      <BrandLogo variant="light" size="large" to="/" />
      <h1 style={{
        fontSize: '36px',
        fontWeight: 600,
        color: 'var(--ink)',
        letterSpacing: '-0.03em',
      }}>
        Welcome to your Dashboard
      </h1>
      <p style={{
        fontSize: '16px',
        color: 'var(--muted)',
        maxWidth: '460px',
      }}>
        You are logged in. This is a placeholder for your opportunity hub, matches, and application tracker.
      </p>
      <Button variant="dark" onClick={() => navigate('/')}>
        Back to Home
      </Button>
    </div>
  );
}
