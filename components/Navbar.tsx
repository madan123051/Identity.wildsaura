'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <nav
      style={{
        background: 'rgba(10,15,13,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,255,136,0.12)',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <span style={{ fontSize: 22, color: '#00ff88', fontWeight: 800, letterSpacing: '-0.5px' }}>
          🌿 WildSaura
        </span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Identity</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {user ? (
          <>
            <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14 }}>
              Dashboard
            </Link>
            <button onClick={handleSignOut} className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
              Sign Out
            </button>
          </>
        ) : (
          <Link href="/login">
            <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
              Sign In
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
}
