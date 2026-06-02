import React from 'react';

interface AuthLogoProps {
  animated?: boolean;
}

export function AuthLogo({ animated = false }: AuthLogoProps) {
  if (animated) {
    return (
      <div className="auth-logo-section">
        <img src="/drishya-logo.png" alt="Drishya Logo" className="auth-logo-image" />
        <h1 className="auth-logo-text auth-typing">
          {'DRISHYA'.split('').map((letter, i) => (
            <span key={i} className="auth-letter" style={{ animationDelay: `${0.15 + i * 0.12}s` }}>
              {letter}
            </span>
          ))}
        </h1>
        <p className="auth-logo-subtitle">Himalayan Vistas</p>
      </div>
    );
  }
  return (
    <div className="auth-logo-section">
      <h1 className="auth-logo-text">DRISHYA</h1>
      <p className="auth-logo-subtitle">Himalayan Vistas</p>
    </div>
  );
}
