import React from 'react';
import { AuthLogo } from './AuthLogo';
import { useAuthCtx } from './AuthContext';

export function ForgotPasswordView() {
  const { loginEmail, setLoginEmail, error, loading, setMode, setError, handleForgotPassword } = useAuthCtx();
  return (
    <div className="auth-page">
      <div className="auth-card">
        <AuthLogo />
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔐</div>
          <h2 style={{ color: '#F0F6FC', fontSize: '1.2rem' }}>Forgot Password?</h2>
          <p style={{ color: '#8B949E', fontSize: '0.85rem' }}>Enter your email and we'll send you a reset link.</p>
        </div>
        <form onSubmit={handleForgotPassword} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <div className="auth-error">⚠ {error}</div>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="auth-spinner">⟳</span> : 'Send Reset Link'}
          </button>
        </form>
        <p className="auth-footer">
          Remember your password?{' '}
          <button className="auth-link" onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
        </p>
      </div>
    </div>
  );
}
