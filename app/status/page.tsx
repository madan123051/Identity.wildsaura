'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import GlassCard from '@/components/GlassCard';
import { useAuth } from '@/lib/authContext';

export default function StatusPage() {
  const { user } = useAuth();

  const statusItems = [
    { label: 'Account Active', value: true },
    { label: 'Email Verified', value: user?.emailVerified ?? false },
    { label: 'Profile Complete', value: !!(user?.displayName) },
    { label: '2FA Enabled', value: (user?.providerData?.length ?? 0) > 1 },
  ];

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>Account Status</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>Overview of your identity health</p>

        <GlassCard>
          {statusItems.map((item, i) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 0',
                borderBottom: i < statusItems.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.75)' }}>{item.label}</span>
              <span
                style={{
                  color: item.value ? '#00ff88' : '#ff6b6b',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {item.value ? '● Active' : '○ Inactive'}
              </span>
            </div>
          ))}
        </GlassCard>
      </div>
    </ProtectedRoute>
  );
}
