'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getSafeRedirectUrl } from '@/lib/redirect';
import GlassCard from '@/components/GlassCard';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(user);
        router.push('/verify');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        const redirect = getSafeRedirectUrl(searchParams.get('redirect'));
        router.push(redirect || '/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <GlassCard style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌿</div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 6 }}>
            WildSaura Identity
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            className="input-field"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input-field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? '...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ color: '#00ff88', cursor: 'pointer', fontWeight: 600 }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </span>
        </p>
      </GlassCard>
    </div>
  );
}
