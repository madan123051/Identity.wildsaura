"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/authContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { getIdentityProfile, type IdentityProfile } from "@/lib/identity";
import { registerConnectedApp } from "@/lib/connectedApps";
import { getVerificationLabel } from "@/lib/verification";
import { getRecentIdentitySessions, touchIdentitySession, type IdentitySession } from "@/lib/sessions";

const statusColors: Record<string, string> = {
  not_started: "text-gray-400",
  pending: "text-yellow-400",
  verified: "text-green-400",
  rejected: "text-red-400",
};

function formatDate(value: any) {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return value.toDate?.().toLocaleString?.() || "—";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [identity, setIdentity] = useState<IdentityProfile | null>(null);
  const [sessions, setSessions] = useState<IdentitySession[]>([]);
  const [loadingIdentity, setLoadingIdentity] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchIdentity = async () => {
      setLoadingIdentity(true);
      try {
        const profile = await getIdentityProfile(db, user);
        setIdentity(profile);
        await Promise.allSettled([
          registerConnectedApp(db, user.uid, "identity"),
          touchIdentitySession(db, user.uid),
        ]);
        setSessions(await getRecentIdentitySessions(db, user.uid));
      } finally {
        setLoadingIdentity(false);
      }
    };
    fetchIdentity();
  }, [user]);

  const status = identity?.verificationStatus || "not_started";
  const connectedApps = identity?.connectedApps;
  const connectedCount = connectedApps
    ? Object.values(connectedApps).filter((app) => app.connected).length
    : 0;

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-6xl mx-auto p-4 pt-24">
        <GlassCard className="mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img
              src={identity?.photoURL || user?.photoURL || "/default-avatar.png"}
              alt="avatar"
              className="w-20 h-20 rounded-full border-2 border-purple-500 object-cover"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold">
                {identity?.displayName || user?.displayName || user?.email || "WildSaura User"}
              </h2>
              <p className={`text-sm font-medium ${statusColors[status]}`}>
                Verification: {getVerificationLabel(status)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Loaded from {loadingIdentity ? "Firebase..." : identity?.source || "auth"} with legacy fallback enabled.
              </p>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/verify">
            <GlassCard className="hover:bg-white/10 transition cursor-pointer text-center">
              <div className="text-3xl mb-2">🛡️</div>
              <h3 className="font-semibold">Verify Identity</h3>
            </GlassCard>
          </Link>
          <Link href="/security">
            <GlassCard className="hover:bg-white/10 transition cursor-pointer text-center">
              <div className="text-3xl mb-2">🔐</div>
              <h3 className="font-semibold">Security</h3>
            </GlassCard>
          </Link>
          <Link href="/apps">
            <GlassCard className="hover:bg-white/10 transition cursor-pointer text-center">
              <div className="text-3xl mb-2">🔗</div>
              <h3 className="font-semibold">Connected Apps</h3>
            </GlassCard>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard>
            <h3 className="text-lg font-semibold mb-4">Profile</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p><span className="text-gray-500">Email:</span> {identity?.email || user?.email || "—"}</p>
              <p><span className="text-gray-500">Username:</span> {identity?.username || "—"}</p>
              <p><span className="text-gray-500">Phone:</span> {identity?.phone || "—"}</p>
              <p><span className="text-gray-500">Province:</span> {identity?.province || "—"}</p>
              <p><span className="text-gray-500">Country:</span> {identity?.country || "—"}</p>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-semibold mb-4">Verification</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p><span className="text-gray-500">Status:</span> <span className={statusColors[status]}>{getVerificationLabel(status)}</span></p>
              <p><span className="text-gray-500">Verified:</span> {identity?.verified ? "Yes" : "No"}</p>
              <p><span className="text-gray-500">Submitted:</span> {formatDate(identity?.submittedAt)}</p>
              <p><span className="text-gray-500">Reviewed:</span> {formatDate(identity?.reviewedAt)}</p>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-semibold mb-4">Documents</h3>
            {identity?.documentUrl ? (
              <a href={identity.documentUrl} target="_blank" rel="noreferrer" className="text-purple-400 underline text-sm">
                View submitted identity document
              </a>
            ) : (
              <p className="text-gray-400 text-sm">No verification document is attached yet.</p>
            )}
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-semibold mb-4">Connected Apps</h3>
            <p className="text-sm text-gray-400 mb-3">{connectedCount} WildSaura app(s) connected.</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {connectedApps && Object.entries(connectedApps).map(([appId, app]) => (
                <span key={appId} className={app.connected ? "text-green-400" : "text-gray-500"}>
                  {app.connected ? "✔" : "—"} {appId}
                </span>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-semibold mb-4">Sessions</h3>
            <div className="space-y-3 text-sm">
              {sessions.length === 0 ? (
                <p className="text-gray-400">No tracked sessions yet.</p>
              ) : sessions.map((session) => (
                <div key={session.id} className="rounded-lg bg-white/5 p-3">
                  <p className="font-medium">{session.device} · {session.browser}</p>
                  <p className="text-gray-500">{session.platform}</p>
                  <p className="text-gray-500">Last seen: {formatDate(session.lastSeen)}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-semibold mb-4">Activity & Security</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p><span className="text-gray-500">Created:</span> {formatDate(identity?.createdAt)}</p>
              <p><span className="text-gray-500">Updated:</span> {formatDate(identity?.updatedAt)}</p>
              <p><span className="text-gray-500">Providers:</span> {user?.providerData.map((p) => p.providerId).join(", ") || "—"}</p>
              <Link href="/security" className="text-purple-400 underline">Manage password and security settings</Link>
            </div>
          </GlassCard>
        </div>
      </main>
    </ProtectedRoute>
  );
}
