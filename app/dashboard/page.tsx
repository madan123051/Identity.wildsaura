"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/authContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import Link from "next/link";
import {
  IdentityProfile,
  formatFirebaseDate,
  getIdentityProfile,
  isAppConnected,
} from "@/lib/identity";
import { CONNECTED_APPS, registerConnectedApp } from "@/lib/connectedApps";
import { getIdentitySessions, IdentitySession, touchIdentitySession } from "@/lib/sessions";

const statusColors: Record<string, string> = {
  not_started: "text-gray-400",
  pending: "text-yellow-400",
  verified: "text-green-400",
  rejected: "text-red-400",
};

const statusLabels: Record<string, string> = {
  not_started: "Not started",
  pending: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [identity, setIdentity] = useState<IdentityProfile | null>(null);
  const [sessions, setSessions] = useState<IdentitySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const fetchIdentity = async () => {
      setLoading(true);
      try {
        await Promise.allSettled([
          registerConnectedApp(db, user.uid, "identity"),
          touchIdentitySession(db, user.uid),
        ]);
        const [profile, activeSessions] = await Promise.all([
          getIdentityProfile(db, user.uid, user),
          getIdentitySessions(db, user.uid).catch(() => []),
        ]);
        if (!alive) return;
        setIdentity(profile);
        setSessions(activeSessions);
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchIdentity();
    return () => {
      alive = false;
    };
  }, [user]);

  const status = identity?.verificationStatus || "not_started";

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-6xl mx-auto p-4 pt-24 space-y-8">
        <GlassCard>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img
              src={identity?.photoURL || user?.photoURL || "/default-avatar.png"}
              alt="avatar"
              className="w-20 h-20 rounded-full border-2 border-purple-500 object-cover"
            />
            <div className="text-center sm:text-left">
              <p className="text-xs uppercase tracking-wide text-purple-300">WildSaura Identity</p>
              <h2 className="text-2xl font-bold">
                {identity?.displayName || user?.email || "WildSaura User"}
              </h2>
              <p className={`text-sm font-medium ${statusColors[status]}`}>
                Verification: {statusLabels[status] || status}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Loaded from {identity?.source || "Firebase Auth"} • UID {user?.uid.slice(0, 12)}...
              </p>
            </div>
          </div>
        </GlassCard>

        {loading ? (
          <GlassCard>
            <p className="text-gray-400">Loading existing Firebase identity data...</p>
          </GlassCard>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard>
                <h3 className="text-lg font-semibold mb-4">Profile</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <Info label="Email" value={identity?.email || user?.email || "—"} />
                  <Info label="Username" value={identity?.username || "—"} />
                  <Info label="Phone" value={identity?.phone || "—"} />
                  <Info label="Province" value={identity?.province || "—"} />
                  <Info label="Country" value={identity?.country || "—"} />
                  <Info label="Gender" value={identity?.gender || "—"} />
                </dl>
              </GlassCard>

              <GlassCard>
                <h3 className="text-lg font-semibold mb-4">Verification</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={`font-semibold ${statusColors[status]}`}>{statusLabels[status]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Verified flag</span>
                    <span>{identity?.verified ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Submitted</span>
                    <span>{formatFirebaseDate(identity?.submittedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Reviewed</span>
                    <span>{formatFirebaseDate(identity?.reviewedAt)}</span>
                  </div>

                  {/* Verify CTA for unverified users */}
                  {(status === 'not_started' || status === 'rejected') && (
                    <div className="pt-2">
                      <Link
                        href="/verify"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition"
                      >
                        {status === 'rejected' ? '🔄 Re-submit Verification' : '✅ Get Verified'}
                      </Link>
                    </div>
                  )}
                  {status === 'pending' && (
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600/20 border border-yellow-600/40 text-yellow-400 text-sm font-semibold rounded-lg">
                        ⏳ Verification under review
                      </span>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard>
                <h3 className="text-lg font-semibold mb-4">Documents</h3>
                {identity?.documentUrl ? (
                  <a className="text-purple-300 underline" href={identity.documentUrl} target="_blank" rel="noreferrer">
                    View submitted document
                  </a>
                ) : (
                  <p className="text-gray-400 text-sm">No verification document on file.</p>
                )}
              </GlassCard>

              <GlassCard>
                <h3 className="text-lg font-semibold mb-4">Security</h3>
                <div className="space-y-3 text-sm">
                  <Info label="Auth providers" value={user?.providerData.map((p) => p.providerId).join(", ") || "—"} />
                  <Info label="Email verified" value={user?.emailVerified ? "Yes" : "No"} />
                  <Link href="/security" className="inline-block text-purple-300 underline">
                    Manage password and security settings
                  </Link>
                </div>
              </GlassCard>
            </div>

            <GlassCard>
              <h3 className="text-lg font-semibold mb-4">Connected Apps</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {CONNECTED_APPS.map((app) => (
                  <div key={app.id} className="rounded-lg bg-white/5 p-3">
                    <p className="font-medium">{app.name}</p>
                    {isAppConnected(identity?.connectedApps || {}, app.id) ? (
                      <p className="text-sm text-green-400">✔ Connected</p>
                    ) : (
                      <p className="text-sm text-gray-500">— Not yet</p>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="text-lg font-semibold mb-4">Sessions</h3>
              {sessions.length ? (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg bg-white/5 p-3 text-sm">
                      <div>
                        <p className="font-medium">{session.device} • {session.browser}</p>
                        <p className="text-gray-500">{session.platform}</p>
                      </div>
                      <p className="text-gray-400">Last seen: {formatFirebaseDate(session.lastSeen)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No active sessions recorded yet.</p>
              )}
            </GlassCard>

            <GlassCard>
              <h3 className="text-lg font-semibold mb-4">Activity</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>Profile created: {formatFirebaseDate(identity?.createdAt)}</p>
                <p>Profile updated: {formatFirebaseDate(identity?.updatedAt)}</p>
                <p>Verification status: {statusLabels[status] || status}</p>
              </div>
            </GlassCard>
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-400 text-xs uppercase tracking-wide">{label}</dt>
      <dd className="text-gray-100 break-words">{value || "—"}</dd>
    </div>
  );
}
