import React from 'react';
import { AuthLogo } from './AuthLogo';
import { useAuthCtx } from './AuthContext';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px', flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function LoginView() {
  const {
    error,
    loading,
    googleLoading,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    showPassword,
    setShowPassword,
    setMode,
    setError,
    handleLogin,
    handleGoogleLogin,
  } = useAuthCtx();

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <AuthLogo animated />
        <h2 className="auth-welcome-heading">WildSaura Identity Junction</h2>
        <p className="auth-welcome-sub">
          Login to manage your WildSaura ecosystem profile, verification, apps, and security from one place.
        </p>

        <button className="auth-google-btn" onClick={handleGoogleLogin} disabled={googleLoading || loading} type="button">
          {googleLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="auth-spinner">⟳</span>Connecting with Google...
            </span>
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>

        <div className="auth-divider"><span>or login with email</span></div>

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="auth-field">
            <label className="auth-label">Email address</label>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                autoComplete="current-password"
                required
                style={{ paddingRight: 88 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#A78BFA',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              className="auth-link"
              onClick={() => { setError(''); setMode('forgot'); }}
            >
              Forgot password?
            </button>
            <span style={{ color: '#6E7681', fontSize: '0.78rem' }}>Secure Firebase login</span>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Login to Dashboard'}
          </button>
        </form>

        <p className="auth-footer">
          New to WildSaura?{' '}
          <button className="auth-link" onClick={() => { setError(''); setMode('signup'); }} type="button">
            Create identity profile
          </button>
        </p>
      </div>
    </div>
  );
}
