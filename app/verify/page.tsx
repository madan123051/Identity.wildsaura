'use client';

import { useState } from 'react';
import { sendEmailVerification, reload } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import GlassCard from '@/components/GlassCard';
import { useRouter } from 'next/navigation';

export default function VerifyPage() {
  const [sent, setSent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState(false);
  const router = useRouter();

  const resend = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      setSent(true);
    }
  };

  const checkVerification = async () => {
    setChecking(true);
    if (auth.currentUser) {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        setVerified(true);
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    }
    setChecking(false);
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <GlassCard style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{verified ? '🎉' : '📧'}</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
          {verified ? 'Email Verified!' : 'Verify Your Email'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 28, lineHeight: 1.6 }}>
          {verified
            ? 'Redirecting to dashboard...'
            : `We sent a verification link to ${auth.currentUser?.email || 'your email'}. Check your inbox and click the link.`}
        </p>

        {!verified && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn-primary" onClick={checkVerification} disabled={checking}>
              {checking ? 'Checking...' : "I've Verified ✅"}
            </button>
            <button
              onClick={resend}
              disabled={sent}
              style={{
                background: 'transparent',
                border: '1px solid rgba(0,255,136,0.3)',
                color: sent ? 'rgba(255,255,255,0.3)' : '#00ff88',
                borderRadius: 12,
                padding: '12px 24px',
                cursor: sent ? 'default' : 'pointer',
              }}
            >
              {sent ? 'Email Sent ✓' : 'Resend Email'}
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
