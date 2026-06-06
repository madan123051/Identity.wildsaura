'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';
import { AdminRoute } from '@/components/ProtectedRoute';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { IdentityProfile, mergeIdentityProfile, normalizeVerificationStatus, formatFirebaseDate } from '@/lib/identity';
import { syncVerificationStatus } from '@/lib/verification';

type AdminUser = IdentityProfile & {
  fullName?: string;
  documentType?: string;
  documentNumber?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  notes?: string;
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const Icons = {
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  XCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  Hash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  ),
  Globe: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  FileText: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Phone: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.23h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.07 6.07l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  CreditCard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Image: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  MessageSquare: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  UserCheck: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  ),
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  verified:    { label: 'Verified',    dot: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30' },
  pending:     { label: 'Pending',     dot: 'bg-amber-400',   badge: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30' },
  rejected:    { label: 'Rejected',    dot: 'bg-red-400',     badge: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30' },
  not_started: { label: 'Not Started', dot: 'bg-gray-500',    badge: 'bg-gray-700/50 text-gray-400 ring-1 ring-gray-600/30' },
};

function StatusBadge({ status, verified }: { status: string; verified?: boolean }) {
  const normalized = normalizeVerificationStatus(status, verified);
  const cfg = STATUS_CONFIG[normalized] ?? STATUS_CONFIG.not_started;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
  const colors = [
    'from-indigo-500 to-purple-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
    'from-sky-500 to-blue-600',
    'from-violet-500 to-fuchsia-600',
  ];
  const colorIndex = (name.charCodeAt(0) || 0) % colors.length;
  return (
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function StatCard({ icon, label, value, gradient, ring }: { icon: React.ReactNode; label: string; value: number; gradient: string; ring: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 bg-gray-900 ring-1 ${ring}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`} />
      <div className="relative">
        <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${gradient} text-white mb-3`}>
          {icon}
        </div>
        <div className="text-3xl font-bold text-white">{value}</div>
        <div className="text-xs text-gray-400 mt-0.5 font-medium">{label}</div>
      </div>
    </div>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mt-4 mb-2">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{children}</span>
      <div className="flex-1 h-px bg-gray-700/60" />
    </div>
  );
}

// ─── Document image thumbnail ─────────────────────────────────────────────────
function DocPhoto({ url, label }: { url: string; label: string }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{label}</div>
      {!imgError ? (
        <a href={url} target="_blank" rel="noreferrer" className="block group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={label}
            onError={() => setImgError(true)}
            className="w-full max-h-44 object-cover rounded-xl border border-gray-700/60 group-hover:border-indigo-500/50 transition"
          />
          <div className="text-[11px] text-indigo-400 hover:text-indigo-300 mt-1 text-center transition">
            View Full Size &rarr;
          </div>
        </a>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700/60 hover:border-indigo-500/40 text-indigo-400 hover:text-indigo-300 text-sm transition"
        >
          <Icons.Image />
          Open {label} &rarr;
        </a>
      )}
    </div>
  );
}

// ─── User card ────────────────────────────────────────────────────────────────
function UserCard({ u, expanded, onToggle, onApprove, onReject, actionLoading }: {
  u: AdminUser;
  expanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  actionLoading: string | null;
}) {
  const normalized = normalizeVerificationStatus(u.verificationStatus, u.verified);
  const displayName = u.displayName || u.fullName || u.username || 'Unknown User';

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
      expanded
        ? 'bg-gray-800/80 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
        : 'bg-gray-900 border-gray-800/60 hover:border-gray-700/80 hover:bg-gray-800/50'
    }`}>
      {/* Collapsed Row */}
      <button
        className="w-full text-left px-4 py-3.5 flex items-center gap-3 group"
        onClick={onToggle}
      >
        <Avatar name={displayName} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm truncate">{displayName}</div>
          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="font-mono truncate">{u.uid.slice(0, 10)}&hellip;</span>
            {u.source && (
              <span className="px-1.5 py-0.5 rounded bg-gray-700/60 text-gray-400 text-[10px] font-medium">
                {u.source}
              </span>
            )}
            {u.submittedAt && (
              <span className="text-gray-600 text-[10px]">
                &middot; {formatFirebaseDate(u.submittedAt)}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={u.verificationStatus} verified={u.verified} />
        <span className={`text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          <Icons.ChevronDown />
        </span>
      </button>

      {/* Expanded Panel */}
      {expanded && (
        <div className="px-4 pb-5 border-t border-gray-700/50 pt-3">

          {/* Personal Info */}
          <SectionLabel>Personal Info</SectionLabel>
          <div className="grid grid-cols-1 gap-2.5">
            {(u.fullName || u.displayName) && (
              <DetailRow icon={<Icons.User />} label="Full Name" value={u.fullName || u.displayName} />
            )}
            <DetailRow icon={<Icons.Mail />} label="Email" value={u.email || '\u2014'} mono />
            {u.phone && <DetailRow icon={<Icons.Phone />} label="Phone" value={u.phone} />}
            {u.dateOfBirth && <DetailRow icon={<Icons.Calendar />} label="Date of Birth" value={u.dateOfBirth} />}
            {u.gender && <DetailRow icon={<Icons.User />} label="Gender" value={u.gender} />}
            {u.country && <DetailRow icon={<Icons.Globe />} label="Country" value={u.country} />}
            {u.province && <DetailRow icon={<Icons.MapPin />} label="Province / State" value={u.province} />}
            {u.address && <DetailRow icon={<Icons.MapPin />} label="Address" value={u.address} />}
            {u.username && <DetailRow icon={<Icons.Hash />} label="Username" value={u.username} mono />}
          </div>

          {/* Document Details */}
          <SectionLabel>Document Details</SectionLabel>
          <div className="grid grid-cols-1 gap-2.5">
            {u.documentType && (
              <DetailRow icon={<Icons.CreditCard />} label="Document Type" value={u.documentType} />
            )}
            {u.documentNumber && (
              <DetailRow icon={<Icons.CreditCard />} label="Document Number" value={u.documentNumber} mono />
            )}
          </div>

          {(u.documentFrontUrl || u.documentUrl) && (
            <div className="mt-3">
              <DocPhoto
                url={u.documentFrontUrl || u.documentUrl || ''}
                label="Front Photo"
              />
            </div>
          )}
          {u.documentBackUrl && (
            <div className="mt-3">
              <DocPhoto url={u.documentBackUrl} label="Back Photo" />
            </div>
          )}
          {!u.documentFrontUrl && !u.documentUrl && !u.documentBackUrl && !u.documentType && !u.documentNumber && (
            <p className="text-xs text-gray-600 italic mt-1">No document submitted</p>
          )}

          {/* Submission Info */}
          <SectionLabel>Submission Info</SectionLabel>
          <div className="grid grid-cols-1 gap-2.5">
            <DetailRow icon={<Icons.Hash />} label="UID" value={u.uid} mono truncate />
            {u.submittedAt && (
              <DetailRow icon={<Icons.Calendar />} label="Submitted At" value={formatFirebaseDate(u.submittedAt)} />
            )}
            {u.reviewedAt && (
              <DetailRow icon={<Icons.UserCheck />} label="Reviewed At" value={formatFirebaseDate(u.reviewedAt)} />
            )}
            {u.notes && (
              <DetailRow icon={<Icons.MessageSquare />} label="Notes" value={u.notes} />
            )}
          </div>

          {/* Action buttons */}
          {normalized === 'pending' && (
            <div className="flex gap-2 pt-4">
              <button
                onClick={(e) => { e.stopPropagation(); onApprove(); }}
                disabled={!!actionLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition-all active:scale-95"
              >
                {actionLoading === u.uid + 'verified' ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Icons.Check />
                )}
                Approve
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReject(); }}
                disabled={!!actionLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold transition-all active:scale-95"
              >
                {actionLoading === u.uid + 'rejected' ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Icons.X />
                )}
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value, mono, truncate }: { icon: React.ReactNode; label: string; value: string; mono?: boolean; truncate?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-gray-500">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">{label}</div>
        <div className={`text-sm text-gray-200 ${mono ? 'font-mono' : ''} ${truncate ? 'truncate' : 'break-all'}`}>{value}</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function AdminDashboardInner() {
  const { user, canReviewVerification, claims } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const byUid = new Map<string, { userData?: any; profileData?: any; verificationData?: any }>();
      const [usersSnap, profilesSnap, verificationsSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), orderBy('updatedAt', 'desc'))).catch(() => getDocs(collection(db, 'users'))),
        getDocs(collection(db, 'profiles')),
        getDocs(collection(db, 'verifications')),
      ]);
      usersSnap.docs.forEach((d) => { byUid.set(d.id, { ...(byUid.get(d.id) || {}), userData: d.data() }); });
      profilesSnap.docs.forEach((d) => { byUid.set(d.id, { ...(byUid.get(d.id) || {}), profileData: d.data() }); });
      verificationsSnap.docs.forEach((d) => { byUid.set(d.id, { ...(byUid.get(d.id) || {}), verificationData: d.data() }); });

      const data: AdminUser[] = Array.from(byUid.entries()).map(([uid, record]) => ({
        ...mergeIdentityProfile({ uid, ...record }),
        fullName:         record.verificationData?.fullName         || record.userData?.fullName,
        country:          record.verificationData?.country          || record.userData?.country          || record.profileData?.country,
        documentType:     record.verificationData?.documentType     || record.userData?.documentType     || '',
        documentNumber:   record.verificationData?.documentNumber   || record.userData?.documentNumber   || '',
        documentFrontUrl: record.verificationData?.documentFrontUrl || record.userData?.documentFrontUrl || '',
        documentBackUrl:  record.verificationData?.documentBackUrl  || record.userData?.documentBackUrl  || '',
        notes:            record.verificationData?.notes            || '',
      }));

      setUsers(data.sort((a, b) =>
        (b.updatedAt?.seconds || b.submittedAt?.seconds || 0) -
        (a.updatedAt?.seconds || a.submittedAt?.seconds || 0)
      ));
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (uid: string, status: 'verified' | 'rejected') => {
    if (!canReviewVerification) { alert('You do not have permission to review verifications.'); return; }
    setActionLoading(uid + status);
    try {
      await syncVerificationStatus(db, uid, status, { uid: user?.uid, email: user?.email });
      setUsers((prev) =>
        prev.map((u) => u.uid === uid ? { ...u, verificationStatus: status, verified: status === 'verified' } : u)
      );
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      u.email?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.uid?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.documentNumber?.toLowerCase().includes(q);
    const normalizedStatus = normalizeVerificationStatus(u.verificationStatus, u.verified);
    const matchFilter = filter === 'all' || normalizedStatus === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    total:    users.length,
    verified: users.filter((u) => normalizeVerificationStatus(u.verificationStatus, u.verified) === 'verified').length,
    pending:  users.filter((u) => normalizeVerificationStatus(u.verificationStatus, u.verified) === 'pending').length,
    rejected: users.filter((u) => normalizeVerificationStatus(u.verificationStatus, u.verified) === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-4">
        <div className="w-10 h-10 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading users&hellip;</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800/70 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Icons.Shield />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Admin Dashboard</h1>
              <p className="text-[11px] text-gray-500 leading-tight">identity.wildsaura.com</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-all active:scale-95"
          >
            <Icons.ArrowLeft />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-10">
        {/* Logged-in badge */}
        <div className="mt-4 mb-5 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 w-fit">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-gray-400 font-mono">{user?.email}</span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-600/25 text-indigo-400 text-[10px] font-semibold">
            {claims?.admin ? 'admin' : claims?.verificationReviewer ? 'reviewer' : 'none'}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard icon={<Icons.Users />}       label="Total Users" value={counts.total}    gradient="from-indigo-500 to-purple-600" ring="ring-indigo-500/20" />
          <StatCard icon={<Icons.CheckCircle />} label="Verified"    value={counts.verified} gradient="from-emerald-500 to-teal-600"  ring="ring-emerald-500/20" />
          <StatCard icon={<Icons.Clock />}       label="Pending"     value={counts.pending}  gradient="from-amber-500 to-orange-600"  ring="ring-amber-500/20" />
          <StatCard icon={<Icons.XCircle />}     label="Rejected"    value={counts.rejected} gradient="from-red-500 to-rose-600"      ring="ring-red-500/20" />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 mb-5">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <Icons.Search />
            </span>
            <input
              type="text"
              placeholder="Search by name, email, phone, doc number, UID&hellip;"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="all">All Users</option>
              <option value="not_started">Not Started</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={fetchUsers}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-semibold text-gray-300 transition-all active:scale-95"
            >
              <Icons.Refresh />
              Refresh
            </button>
          </div>
        </div>

        {/* User Count */}
        <p className="text-xs text-gray-600 mb-3 font-medium">
          {filtered.length} user{filtered.length !== 1 ? 's' : ''} {filter !== 'all' ? `\u00b7 ${filter}` : ''}
        </p>

        {/* User Cards */}
        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <div className="text-4xl mb-2">&#x1F50D;</div>
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            filtered.map((u) => (
              <UserCard
                key={u.uid}
                u={u}
                expanded={expandedUid === u.uid}
                onToggle={() => setExpandedUid(expandedUid === u.uid ? null : u.uid)}
                onApprove={() => updateStatus(u.uid, 'verified')}
                onReject={() => updateStatus(u.uid, 'rejected')}
                actionLoading={actionLoading}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminDashboardInner />
    </AdminRoute>
  );
}
