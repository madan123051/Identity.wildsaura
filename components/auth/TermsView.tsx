import React from 'react';
import { AuthLogo } from './AuthLogo';
import { useAuthCtx } from './AuthContext';
import { TERMS_AND_CONDITIONS } from './authConstants';

export function TermsView() {
  const {
    termsRef, termsRead, termsAccepted, setTermsAccepted,
    ageConfirmed, setAgeConfirmed, error, loading,
    setSignupStep, setError, handleAcceptAndCreate, handleTermsScroll,
  } = useAuthCtx();

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <AuthLogo />
        <h2 style={{ color: '#F0F6FC', fontSize: '1.1rem', textAlign: 'center', marginBottom: '0.5rem' }}>
          📜 Terms &amp; Conditions
        </h2>
        <p style={{ color: '#8B949E', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1rem' }}>
          Please read and accept all terms before continuing
        </p>

        <div
          ref={termsRef}
          onScroll={handleTermsScroll}
          style={{
            maxHeight: 280, overflowY: 'auto', background: '#0D1117',
            border: '1px solid #21262D', borderRadius: 8, padding: '1rem',
            fontSize: '0.78rem', color: '#C9D1D9', lineHeight: 1.7,
            whiteSpace: 'pre-wrap', marginBottom: '1rem',
          }}
        >
          {TERMS_AND_CONDITIONS}
        </div>

        {!termsRead && (
          <p style={{ color: '#F59E0B', fontSize: '0.75rem', textAlign: 'center', marginBottom: '0.5rem' }}>
            ⬇️ Scroll down to read all terms
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#C9D1D9', fontSize: '0.82rem', cursor: termsRead ? 'pointer' : 'not-allowed', opacity: termsRead ? 1 : 0.5 }}>
            <input type="checkbox" checked={ageConfirmed} onChange={e => setAgeConfirmed(e.target.checked)} disabled={!termsRead} style={{ marginTop: 3, accentColor: '#0D9488' }} />
            <span>I confirm I am 16 years or older ✅</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#C9D1D9', fontSize: '0.82rem', cursor: termsRead ? 'pointer' : 'not-allowed', opacity: termsRead ? 1 : 0.5 }}>
            <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} disabled={!termsRead} style={{ marginTop: 3, accentColor: '#0D9488' }} />
            <span>I accept all Terms &amp; Conditions ✅</span>
          </label>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: '0.75rem' }}>⚠ {error}</div>}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="auth-btn"
            style={{ flex: 1, background: 'transparent', border: '1px solid #30363D', color: '#8B949E' }}
            onClick={() => { setSignupStep(1); setError(''); }}
          >
            ← Back
          </button>
          <button
            className="auth-btn"
            style={{ flex: 2, opacity: (termsAccepted && ageConfirmed) ? 1 : 0.5 }}
            disabled={!termsAccepted || !ageConfirmed || loading}
            onClick={handleAcceptAndCreate}
          >
            {loading ? <span className="auth-spinner">⟳</span> : '🏔️ Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
