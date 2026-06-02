'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import GlassCard from '@/components/GlassCard';

const connectedApps = [
  { name: 'WildSaura Main', domain: 'wildsaura.com', icon: '🌿', status: 'active' },
  { name: 'WildSaura Dashboard', domain: 'app.wildsaura.com', icon: '📊', status: 'active' },
  { name: 'WildSaura Docs', domain: 'docs.wildsaura.com', icon: '📚', status: 'coming_soon' },
];

export default function AppsPage() {
  return (
    <ProtectedRoute>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>Connected Apps</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
          Apps linked to your WildSaura Identity
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {connectedApps.map((app) => (
            <GlassCard key={app.name} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 32 }}>{app.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700 }}>{app.name}</p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{app.domain}</p>
              </div>
              <span
                style={{
                  fontSize: 12,
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: app.status === 'active' ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.07)',
                  color: app.status === 'active' ? '#00ff88' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${app.status === 'active' ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                {app.status === 'active' ? 'Active' : 'Coming Soon'}
              </span>
            </GlassCard>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
