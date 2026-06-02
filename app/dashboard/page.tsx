'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import GlassCard from '@/components/GlassCard';
import { useAuth } from '@/lib/authContext';
import Link from 'next/link';

const quickLinks = [
  { href: '/apps', icon: '🔗', label: 'Connected Apps' },
  { href: '/security', icon: '🛡️', label: 'Security' },
  { href: '/verify', icon: '✅', label: 'Verification' },
  { href: '/status', icon: '📊', label: 'Account Status' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
          Hello, <span style={{ color: '#00ff88' }}>{user?.displayName || user?.email?.split('@')[0]} 👋</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 40 }}>Your WildSaura Identity Dashboard</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
              <GlassCard className="text-center" style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{link.icon}</div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{link.label}</p>
              </GlassCard>
            </Link>
          ))}
        </div>

        <GlassCard style={{ marginTop: 32 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 16, color: '#00ff88' }}>Account Info</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Email</span>
              <span>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Verified</span>
              <span style={{ color: user?.emailVerified ? '#00ff88' : '#ff6b6b' }}>
                {user?.emailVerified ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>UID</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{user?.uid}</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </ProtectedRoute>
  );
}
