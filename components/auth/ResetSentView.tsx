import React from 'react';
import { AuthLogo } from './AuthLogo';
import { useAuthCtx } from './AuthContext';

export function ResetSentView() {
  const { resetSent, setMode, setError } = useAuthCtx();
  return (
    <div className="auth-page">
      <div className="auth-card">
        <AuthLogo />
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔑</div>
          <h2 style={{ color: '#F0F6FC', marginBottom: '0.5rem', fontSize: '1.3rem' }}>Reset Link Sent!</h2>
          <p style={{ color: '#8B949E', lineHeight: '1.6', fontSize: '0.9rem' }}>
            We sent a password reset link to<br />
            <strong style={{ color: '#0D9488' }}>{resetSent}</strong>
          </p>
          <button
            className="auth-btn"
            style={{ marginTop: '1.5rem' }}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
