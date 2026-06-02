'use client';

import Link from 'next/link';
import GlassCard from '@/components/GlassCard';

const features = [
  { icon: '🔐', title: 'One Login', desc: 'Single sign-on across all WildSaura apps' },
  { icon: '✅', title: 'Verified Identity', desc: 'Email & phone verification built-in' },
  { icon: '🛡️', title: 'Secure by Default', desc: 'Firebase Auth with 2FA support' },
  { icon: '⚡', title: 'Instant Access', desc: 'Seamless redirect to your destination app' },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: '90vh', padding: '60px 24px', maxWidth: 900, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🌿</div>
        <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 16, lineHeight: 1.15 }}>
          WildSaura{' '}
          <span style={{ color: '#00ff88' }}>Identity</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, marginBottom: 36, maxWidth: 520, margin: '0 auto 36px' }}>
          One identity. All WildSaura apps. Login once, access everything.
        </p>
        <Link href="/login">
          <button className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
            Get Started →
          </button>
        </Link>
      </div>

      {/* Features */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        {features.map((f) => (
          <GlassCard key={f.title} className="text-center">
            <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
            <h3 style={{ fontWeight: 700, marginBottom: 8, color: '#00ff88' }}>{f.title}</h3>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>{f.desc}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
