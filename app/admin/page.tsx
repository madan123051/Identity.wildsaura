'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';
import { AdminRoute } from '@/components/ProtectedRoute';
import { collection, getDocs } from 'firebase/firestore';
import { normalizeIdentityProfile } from '@/lib/identity';
import { normalizeVerificationStatus, syncVerificationStatus, type VerificationStatus } from '@/lib/verification';

interface UserData {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  fullName?: string | null;
  country?: string | null;
  documentUrl?: string | null;
  verificationStatus: VerificationStatus;
  submittedAt?: any;
  reviewedAt?: any;
  source: string;
}

function formatDate(value: any) {
  if (!value) return '—';
  return value.toDate?.().toLocaleString?.() || value;
}

function AdminDashboardInner() {
  const { user, isAdmin, isVerificationReviewer } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [usersSnapshot, profilesSnapshot, verificationsSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'profiles')),
        getDocs(collection(db, 'verifications')),
      ]);

      const byUid = new Map<string, { userData?: any; profileData?: any; verificationData?: any }>();
      usersSnapshot.docs.forEach((d) => byUid.set(d.id, { ...(byUid.get(d.id) || {}), userData: { uid: d.id, ...d.data() } }));
      profilesSnapshot.docs.forEach((d) => byUid.set(d.id, { ...(byUid.get(d.id) || {}), profileData: { id: d.id, ...d.data() } }));
      verificationsSnapshot.docs.forEach((d) => byUid.set(d.id, { ...(byUid.get(d.id) || {}), verificationData: { uid: d.id, ...d.data() } }));

      const data = Array.from(byUid.entries()).map(([uid, value]) => {
        const identity = normalizeIdentityProfile({ uid, ...value });
        return {
          uid,
          email: identity.email,
          displayName: identity.displayName,
          fullName: value.verificationData?.fullName || value.userData?.fullName || identity.displayName,
          country: identity.country,
          documentUrl: identity.documentUrl,
          verificationStatus: identity.verificationStatus,
          submittedAt: identity.submittedAt,
          reviewedAt: identity.reviewedAt,
          source: identity.source,
        };
      });

      data.sort((a, b) => {
        const aTime = a.submittedAt?.toMillis?.() || 0;
        const bTime = b.submittedAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (uid: string, status: 'verified' | 'rejected') => {
    if (!user || (!isAdmin && !isVerificationReviewer)) return;
    setActionLoading(uid + status);
    try {
      await syncVerificationStatus(db, uid, status, { uid: user.uid, email: user.email });
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, verificationStatus: status } : u))
      );
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    const haystack = [u.email, u.displayName, u.fullName, u.uid].filter(Boolean).join(' ').toLowerCase();
    const matchSearch = haystack.includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.verificationStatus === normalizeVerificationStatus(filter);
    return matchSearch && matchFilter;
  });

  const counts = {
    total: users.length,
    verified: users.filter((u) => u.verificationStatus === 'verified').length,
    pending: users.filter((u) => u.verificationStatus === 'pending').length,
    rejected: users.filter((u) => u.verificationStatus === 'rejected').length,
  };

  const statusBadge = (status: VerificationStatus) => {
    const styles: Record<VerificationStatus, string> = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      not_started: 'bg-gray-100 text-gray-600',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-xl animate-pulse">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Identity Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Claims-protected verification review across users, profiles, and verifications.</p>
        </div>
        <button onClick={() => router.push('/')} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition">
          ← Back to Home
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-6xl mx-auto">
        {[
          { label: 'Total Users', value: counts.total, color: 'bg-indigo-600', emoji: '👥' },
          { label: 'Verified', value: counts.verified, color: 'bg-green-600', emoji: '✅' },
          { label: 'Pending', value: counts.pending, color: 'bg-yellow-500', emoji: '⏳' },
          { label: 'Rejected', value: counts.rejected, color: 'bg-red-600', emoji: '❌' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-xl p-4 text-center`}>
            <div className="text-3xl mb-1">{stat.emoji}</div>
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-sm opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name, email, or UID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Users</option>
          <option value="not_started">Not Started</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={fetchUsers} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition">
          🔄 Refresh
        </button>
      </div>

      <div className="max-w-6xl mx-auto bg-gray-900 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 text-gray-400 text-sm">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500">No users found</td>
                </tr>
              )}
              {filtered.map((u) => (
                <Fragment key={u.uid}>
                  <tr className="hover:bg-gray-800 cursor-pointer transition" onClick={() => setExpandedUid(expandedUid === u.uid ? null : u.uid)}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.displayName || u.fullName || '—'}</div>
                      <div className="text-xs text-gray-500">{u.uid.slice(0, 12)}... · {u.source}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{u.email || '—'}</td>
                    <td className="px-4 py-3">{statusBadge(u.verificationStatus)}</td>
                    <td className="px-4 py-3">
                      {u.verificationStatus === 'pending' ? (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => updateStatus(u.uid, 'verified')} disabled={actionLoading === u.uid + 'verified'} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-semibold disabled:opacity-50 transition">
                            {actionLoading === u.uid + 'verified' ? '...' : '✅ Approve'}
                          </button>
                          <button onClick={() => updateStatus(u.uid, 'rejected')} disabled={actionLoading === u.uid + 'rejected'} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold disabled:opacity-50 transition">
                            {actionLoading === u.uid + 'rejected' ? '...' : '❌ Reject'}
                          </button>
                        </div>
                      ) : <span className="text-xs text-gray-500">—</span>}
                    </td>
                  </tr>
                  {expandedUid === u.uid && (
                    <tr className="bg-gray-800">
                      <td colSpan={4} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div><div className="text-gray-400 text-xs mb-1">Full Name</div><div>{u.fullName || '—'}</div></div>
                          <div><div className="text-gray-400 text-xs mb-1">Country</div><div>{u.country || '—'}</div></div>
                          <div><div className="text-gray-400 text-xs mb-1">Submitted At</div><div>{formatDate(u.submittedAt)}</div></div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Document</div>
                            {u.documentUrl ? <a href={u.documentUrl} target="_blank" rel="noreferrer" className="text-indigo-400 underline">View Document</a> : '—'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminRoute>
      <AdminDashboardInner />
    </AdminRoute>
  );
}
