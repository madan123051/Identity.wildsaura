'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';

const ADMIN_EMAIL = 'madan123050@gmail.com';

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  fullName?: string;
  country?: string;
  documentURL?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | string;
  submittedAt?: any;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        setLoading(false);
        setAuthorized(false);
        return;
      }
      setAuthorized(true);
      await fetchUsers();
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('submittedAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ uid: d.id, ...d.data() } as UserData));
      setUsers(data);
    } catch {
      const snapshot = await getDocs(collection(db, 'users'));
      const data = snapshot.docs.map((d) => ({ uid: d.id, ...d.data() } as UserData));
      setUsers(data);
    }
  };

  const updateStatus = async (uid: string, status: 'verified' | 'rejected') => {
    setActionLoading(uid + status);
    await updateDoc(doc(db, 'users', uid), { verificationStatus: status });
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, verificationStatus: status } : u))
    );
    setActionLoading(null);
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.uid?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.verificationStatus === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    total: users.length,
    verified: users.filter((u) => u.verificationStatus === 'verified').length,
    pending: users.filter((u) => u.verificationStatus === 'pending').length,
    rejected: users.filter((u) => u.verificationStatus === 'rejected').length,
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400">Only admins can access this page.</p>
          <button onClick={() => router.push('/')} className="mt-6 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">🛡️ Admin Dashboard</h1>
        <p className="text-gray-400 mt-1">identity.wildsaura.com — User Verification Management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
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
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          onClick={fetchUsers}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900 rounded-xl overflow-hidden">
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
              {filtered.map((user) => (
                <>
                  <tr
                    key={user.uid}
                    className="hover:bg-gray-800 cursor-pointer transition"
                    onClick={() => setExpandedUid(expandedUid === user.uid ? null : user.uid)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{user.displayName || user.fullName || '—'}</div>
                      <div className="text-xs text-gray-500">{user.uid.slice(0, 12)}...</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{user.email}</td>
                    <td className="px-4 py-3">{statusBadge(user.verificationStatus)}</td>
                    <td className="px-4 py-3">
                      {user.verificationStatus === 'pending' && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => updateStatus(user.uid, 'verified')}
                            disabled={actionLoading === user.uid + 'verified'}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-semibold disabled:opacity-50 transition"
                          >
                            {actionLoading === user.uid + 'verified' ? '...' : '✅ Approve'}
                          </button>
                          <button
                            onClick={() => updateStatus(user.uid, 'rejected')}
                            disabled={actionLoading === user.uid + 'rejected'}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold disabled:opacity-50 transition"
                          >
                            {actionLoading === user.uid + 'rejected' ? '...' : '❌ Reject'}
                          </button>
                        </div>
                      )}
                      {user.verificationStatus !== 'pending' && (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                  {expandedUid === user.uid && (
                    <tr key={user.uid + '-expanded'} className="bg-gray-800">
                      <td colSpan={4} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Full Name</div>
                            <div>{user.fullName || '—'}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Country</div>
                            <div>{user.country || '—'}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Submitted At</div>
                            <div>{user.submittedAt?.toDate?.()?.toLocaleString() || '—'}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Document</div>
                            {user.documentURL ? (
                              <a href={user.documentURL} target="_blank" rel="noreferrer" className="text-indigo-400 underline">View Document</a>
                            ) : '—'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
