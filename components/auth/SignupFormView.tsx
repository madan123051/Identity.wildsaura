import React from 'react';
import { AuthLogo } from './AuthLogo';
import { useAuthCtx } from './AuthContext';
import { NEPAL_PROVINCES } from './authConstants';
import { calculateAge } from './authUtils';

export function SignupFormView() {
  const {
    googleUser, googleLoading, fullName, setFullName, username, setUsername,
    dateOfBirth, setDateOfBirth, gender, setGender, phone, setPhone,
    address, setAddress, province, setProvince, signupEmail, setSignupEmail,
    signupPassword, setSignupPassword, confirmPassword, setConfirmPassword,
    showPassword, setShowPassword, usernameAvailable, usernameChecking,
    error, maxDobDate, setMode, setError, setGoogleUser,
    handleNextToTerms, handleGoogleSignup,
  } = useAuthCtx();

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <AuthLogo />
        <h2 style={{ color: '#F0F6FC', fontSize: '1.1rem', textAlign: 'center', marginBottom: '0.25rem' }}>
          🏔️ Drishya मा स्वागत छ!
        </h2>
        <p style={{ color: '#8B949E', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1rem' }}>
          नेपाली संस्कृति र प्रकृतिलाई विश्वमा चिनाउनुहोस्<br />
          <span style={{ fontSize: '0.75rem' }}>Share Nepal's culture & nature with the world</span>
        </p>

        {!googleUser && (
          <>
            <button className="auth-google-btn" onClick={handleGoogleSignup} disabled={googleLoading}>
              {googleLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="auth-spinner">⟳</span>Google सँग जडान हुँदैछ...
                </span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google बाट दर्ता गर्नुहोस् (Sign up with Google)
                </>
              )}
            </button>
            <div className="auth-divider"><span>वा email प्रयोग गर्नुहोस्</span></div>
          </>
        )}

        {googleUser && (
          <div style={{ background: '#0D1117', border: '1px solid #238636', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {googleUser.photoURL && <img src={googleUser.photoURL} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />}
            <div>
              <div style={{ color: '#F0F6FC', fontSize: '0.85rem', fontWeight: 600 }}>{googleUser.displayName}</div>
              <div style={{ color: '#8B949E', fontSize: '0.75rem' }}>{googleUser.email}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#238636', fontSize: '0.8rem' }}>✓ Connected</span>
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); handleNextToTerms(); }} className="auth-form" style={{ gap: '0.6rem' }}>
          <div className="auth-field">
            <label className="auth-label">👤 पूरा नाम (Full Name) *</label>
            <input type="text" className="auth-input" placeholder="तपाईंको पूरा नाम" value={fullName} onChange={e => setFullName(e.target.value)} required maxLength={50} />
          </div>

          <div className="auth-field">
            <label className="auth-label">
              🆔 Username *
              {usernameChecking && <span style={{ color: '#8B949E', fontSize: '0.7rem', marginLeft: 6 }}>checking...</span>}
              {usernameAvailable === true && username && <span style={{ color: '#238636', fontSize: '0.7rem', marginLeft: 6 }}>✓ उपलब्ध (Available)</span>}
              {usernameAvailable === false && <span style={{ color: '#F85149', fontSize: '0.7rem', marginLeft: 6 }}>✗ लिइसकेको (Taken)</span>}
            </label>
            <input
              type="text" className="auth-input" placeholder="your_username" value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))}
              required maxLength={20}
              style={{ borderColor: usernameAvailable === false ? '#F85149' : usernameAvailable === true ? '#238636' : undefined }}
            />
            <span style={{ color: '#6E7681', fontSize: '0.7rem' }}>3-20 characters, lowercase, numbers, underscore</span>
          </div>

          <div className="auth-field">
            <label className="auth-label">🎂 जन्म मिति (Date of Birth) * <span style={{ color: '#F59E0B', fontSize: '0.7rem' }}>— 16+ आवश्यक</span></label>
            <input type="date" className="auth-input" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} max={maxDobDate} required style={{ colorScheme: 'dark' }} />
            {dateOfBirth && calculateAge(dateOfBirth) < 16 && (
              <span style={{ color: '#F85149', fontSize: '0.75rem' }}>⚠ तपाईं कम्तीमा १६ वर्षको हुनुपर्छ (Must be 16+)</span>
            )}
          </div>

          <div className="auth-field">
            <label className="auth-label">⚧ लिंग (Gender) *</label>
            <select className="auth-input" value={gender} onChange={e => setGender(e.target.value)} required style={{ colorScheme: 'dark' }}>
              <option value="">— चयन गर्नुहोस् (Select) —</option>
              <option value="male">पुरुष (Male)</option>
              <option value="female">महिला (Female)</option>
              <option value="other">अन्य (Other)</option>
              <option value="prefer_not_to_say">भन्न चाहन्नँ (Prefer not to say)</option>
            </select>
          </div>

          <div className="auth-field">
            <label className="auth-label">📱 फोन नम्बर (Phone Number) *</label>
            <input type="tel" className="auth-input" placeholder="+977-98XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} required maxLength={15} />
          </div>

          <div className="auth-field">
            <label className="auth-label">📍 ठेगाना (Address) *</label>
            <input type="text" className="auth-input" placeholder="तपाईंको शहर/गाउँ" value={address} onChange={e => setAddress(e.target.value)} required maxLength={100} />
          </div>

          <div className="auth-field">
            <label className="auth-label">🗺️ प्रदेश (Province) *</label>
            <select className="auth-input" value={province} onChange={e => setProvince(e.target.value)} required style={{ colorScheme: 'dark' }}>
              <option value="">— प्रदेश चयन गर्नुहोस् —</option>
              {NEPAL_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {!googleUser && (
            <>
              <div className="auth-field">
                <label className="auth-label">📧 Gmail / Email *</label>
                <input type="email" className="auth-input" placeholder="you@gmail.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
              </div>
              <div className="auth-field">
                <label className="auth-label">🔒 Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'} className="auth-input"
                    placeholder="कम्तीमा ६ अक्षर" value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)} required minLength={6} style={{ paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8B949E', cursor: 'pointer', fontSize: '0.85rem' }}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">🔒 Confirm Password *</label>
                <input type="password" className="auth-input" placeholder="Password दोहोर्याउनुहोस्" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                {confirmPassword && signupPassword !== confirmPassword && (
                  <span style={{ color: '#F85149', fontSize: '0.75rem' }}>⚠ Password मेल खाएन</span>
                )}
              </div>
            </>
          )}

          {error && <div className="auth-error">⚠ {error}</div>}
          <button type="submit" className="auth-btn" style={{ marginTop: '0.5rem' }}>
            अर्को चरण → नियम र सर्तहरू (Next → Terms)
          </button>
        </form>

        <p className="auth-footer">
          पहिले नै खाता छ?{' '}
          <button className="auth-link" onClick={() => { setMode('login'); setError(''); setGoogleUser(null); }}>
            Sign In गर्नुहोस्
          </button>
        </p>
      </div>
    </div>
  );
}
