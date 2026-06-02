import React from 'react';

interface AuthLogoProps {
  animated?: boolean;
}

const brand = 'WILDSAURA ID';

export function AuthLogo({ animated = false }: AuthLogoProps) {
  if (animated) {
    return (
      <div className="auth-logo-section">
        <div className="auth-logo-mark">WS</div>
        <h1 className="auth-logo-text auth-typing">
          {brand.split('').map((letter, i) => (
            <span key={i} className="auth-letter" style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          ))}
        </h1>
        <p className="auth-logo-subtitle">Ecosystem Identity Junction</p>
      </div>
    );
  }
  return (
    <div className="auth-logo-section">
      <div className="auth-logo-mark">WS</div>
      <h1 className="auth-logo-text">WildSaura ID</h1>
      <p className="auth-logo-subtitle">Ecosystem Identity Junction</p>
    </div>
  );
}
