'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import GlassCard from '@/components/GlassCard';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import { useAuth } from '@/lib/authContext';

export default function SecurityPage() {
  const { user } = useAuth();
  const [resetSent, setResetSent] = useState(false);

  const handlePasswordReset = async () => {
    if (user?.email) {
      await sendPasswordResetEmail(auth, user.email);
      setResetSent(true);
    }
  };

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>Security Settings</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>Manage your account security</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <GlassCard>
            <h3 style={{ fontWeight: 700, marginBottom: 8, color: '#00ff88' }}>🔑 Password</h3>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 16 }}>
              Send a password reset link to {user?.email}
            </p>
            <button
              className="btn-primary"
              onClick={handlePasswordReset}
              disabled={resetSent}
              style={{ opacity: resetSent ? 0.6 : 1 }}
            >
              {resetSent ? 'Reset Email Sent ✓' : 'Send Reset Email'}
            </button>
          </GlassCard>

          <GlassCard>
            <h3 style={{ fontWeight: 700, marginBottom: 8, color: '#00ff88' }}>📱 Two-Factor Auth</h3>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 16 }}>
              Add an extra layer of security with 2FA.
            </p>
            <span
              style={{
                display: 'inline-block',
                fontSize: 12,
                padding: '4px 12px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Coming Soon
            </span>
          </GlassCard>

          <GlassCard>
            <h3 style={{ fontWeight: 700, marginBottom: 8, color: '#ff6b6b' }}>⚠️ Danger Zone</h3>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>
              Account deletion and data export options will be available here.
            </p>
          </GlassCard>
        </div>
      </div>
    </ProtectedRoute>
  );
}
