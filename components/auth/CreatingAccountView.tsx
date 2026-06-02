import React from 'react';
import { AuthLogo } from './AuthLogo';
import { useAuthCtx } from './AuthContext';

export function CreatingAccountView() {
  const { error } = useAuthCtx();
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <AuthLogo />
        <div style={{ padding: '2rem 0' }}>
          <div className="spin" style={{ fontSize: 32, color: '#0D9488', marginBottom: '1rem' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <h2 style={{ color: '#F0F6FC', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            🏔️ Creating your account...
          </h2>
          <p style={{ color: '#8B949E', fontSize: '0.85rem' }}>Setting up your Drishya identity</p>
          {error && <div className="auth-error" style={{ marginTop: '1rem' }}>⚠ {error}</div>}
        </div>
      </div>
    </div>
  );
}
