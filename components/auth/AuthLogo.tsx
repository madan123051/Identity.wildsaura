import React from 'react';
import Image from 'next/image';

interface AuthLogoProps {
  animated?: boolean;
}

const brand = 'WILDSAURA';

export function AuthLogo({ animated = false }: AuthLogoProps) {
  if (animated) {
    return (
      <div className="auth-logo-section">
        <div className="flex justify-center mb-3">
          <Image
            src="/logo.png"
            alt="WildSaura Identity"
            width={72}
            height={72}
            className="drop-shadow-lg"
            priority
          />
        </div>
        <h1 className="auth-logo-text auth-typing">
          {brand.split('').map((letter, i) => (
            <span key={i} className="auth-letter" style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          ))}
          <span className="auth-letter" style={{ animationDelay: `${0.15 + brand.length * 0.08}s`, opacity: 0.35 }}>R</span>
        </h1>
        <p className="auth-logo-subtitle">Ecosystem Identity Junction</p>
      </div>
    );
  }
  return (
    <div className="auth-logo-section">
      <div className="flex justify-center mb-3">
        <Image
          src="/logo.png"
          alt="WildSaura Identity"
          width={72}
          height={72}
          className="drop-shadow-lg"
          priority
        />
      </div>
      <h1 className="auth-logo-text">WILDSAUR<span style={{ opacity: 0.35 }}>A</span></h1>
      <p className="auth-logo-subtitle">Ecosystem Identity Junction</p>
    </div>
  );
}
