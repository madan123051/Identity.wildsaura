"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/authContext";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import Link from "next/link";
import {
  ConnectedAppId,
  IdentityProfile,
  VerificationStatus,
  formatFirebaseDate,
  getIdentityProfile,
  isAppConnected,
} from "@/lib/identity";
import { CONNECTED_APPS, registerConnectedApp } from "@/lib/connectedApps";
import { getIdentitySessions, IdentitySession, touchIdentitySession } from "@/lib/sessions";

const statusMeta: Record<VerificationStatus, { label: string; tone: string; badge: string; message: string }> = {
  not_started: {
    label: "Not started",
    tone: "text-gray-300",
    badge: "bg-gray-500/15 border-gray-400/30 text-gray-200",
    message: "Submit your profile and identity document to unlock trusted ecosystem access.",
  },
  pending: {
    label: "Pending review",
    tone: "text-amber-300",
    badge: "bg-amber-500/15 border-amber-400/30 text-amber-200",
    message: "Your verification request is in review. You can still manage your profile and apps.",
  },
  verified: {
    label: "Verified",
    tone: "text-emerald-300",
    badge: "bg-emerald-500/15 border-emerald-400/30 text-emerald-200",
    message: "Your WildSaura identity is verified across the ecosystem junction.",
  },
  rejected: {
    label: "Rejected",
    tone: "text-red-300",
    badge: "bg-red-500/15 border-red-400/30 text-red-200",
    message: "Your last request needs correction. Review your information and resubmit verification.",
  },
};

const appDescriptions: Partial<Record<ConnectedAppId, string>> = {
  identity: "Central login, profile, and verification junction.",
  market: "Trusted seller, buyer, and eco-commerce access.",
  drishya: "Creator and community identity for nature stories.",
  community: "WildSaura social and conservation participation.",
  creator: "Creator profile, portfolio, and verified opportunities.",
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

  const status: VerificationStatus = identity?.verificationStatus || "not_started";
  const meta = statusMeta[status];

  const completion = useMemo(() => {
    const checks = [
      Boolean(identity?.displayName),
      Boolean(identity?.username),
      Boolean(identity?.phone),
      Boolean(identity?.address || identity?.province || identity?.country),
      status === "verified",
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [identity, status]);

  const connectedCount = CONNECTED_APPS.filter((app) => isAppConnected(identity?.connectedApps || {}, app.id)).length;

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 pt-36 lg:pt-28 pb-12 space-y-8">
        <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-6">
          <GlassCard className="overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-emerald-500/10 pointer-events-none" />
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <img
                  src={identity?.photoURL || user?.photoURL || "https://api.dicebear.com/8.x/initials/svg?seed=WildSaura"}
                  alt="WildSaura profile avatar"
                  className="w-24 h-24 rounded-3xl border border-purple-300/40 object-cover bg-white/10"
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-purple-200">WildSaura Ecosystem Junction</p>
                  <h1 className="text-3xl lg:text-5xl font-black mt-2">
                    {identity?.displayName || user?.email || "WildSaura User"}
                  </h1>
                  <p className="text-gray-300 mt-3 max-w-2xl">
                    Manage one identity for WildSaura apps, profile trust, verification review, connected services, and account security.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-5">
                    <Link href="/verify" className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 font-semibold transition">
                      {status === "verified" ? "View verification" : "Start verification"}
                    </Link>
                    <Link href="/profile" className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 font-semibold transition">
                      Complete profile
                    </Link>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 min-w-[240px]">
                <p className="text-sm text-gray-400">Verification status</p>
                <div className={`mt-3 inline-flex rounded-full border px-4 py-2 text-sm font-bold ${meta.badge}`}>
                  {meta.label}
                </div>
                <p className="text-sm text-gray-300 mt-4">{meta.message}</p>
                <p className="text-xs text-gray-500 mt-4">UID: {user?.uid.slice(0, 16)}...</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-xl font-bold mb-4">Identity readiness</h2>
            <div className="relative h-3 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400" style={{ width: `${completion}%` }} />
            </div>
            <p className="text-4xl font-black mt-4">{completion}%</p>
            <p className="text-sm text-gray-400 mt-2">Profile completion and verification readiness score.</p>
            <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
              <Metric label="Connected apps" value={`${connectedCount}/${CONNECTED_APPS.length}`} />
              <Metric label="Active sessions" value={`${sessions.length}`} />
            </div>
          </GlassCard>
        </section>

        {loading ? (
          <GlassCard>
            <p className="text-gray-400">Loading your WildSaura identity records...</p>
          </GlassCard>
        ) : (
          <>
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GlassCard className="lg:col-span-2">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-bold">Profile overview</h2>
                    <p className="text-sm text-gray-400">Synced with WildSaura users and profiles collections.</p>
                  </div>
                  <Link href="/profile" className="text-sm text-purple-300 hover:text-purple-100">Edit profile</Link>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <Info label="Email" value={identity?.email || user?.email || "—"} />
                  <Info label="Username" value={identity?.username ? `@${identity.username}` : "—"} />
                  <Info label="Phone" value={identity?.phone || "—"} />
                  <Info label="Province" value={identity?.province || "—"} />
                  <Info label="Country" value={identity?.country || "—"} />
                  <Info label="Gender" value={identity?.gender || "—"} />
                </dl>
              </GlassCard>

              <GlassCard>
                <h2 className="text-xl font-bold mb-4">Verification panel</h2>
                <div className="space-y-4 text-sm">
                  <StatusRow label="Current status" value={meta.label} className={meta.tone} />
                  <StatusRow label="Submitted" value={formatFirebaseDate(identity?.submittedAt)} />
                  <StatusRow label="Reviewed" value={formatFirebaseDate(identity?.reviewedAt)} />
                  <StatusRow label="Verified flag" value={identity?.verified ? "Yes" : "No"} />
                </div>
                <Link href="/verify" className="mt-5 block w-full text-center rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-3 font-semibold transition">
                  {status === "rejected" ? "Resubmit verification" : status === "pending" ? "Review submission" : status === "verified" ? "View verified profile" : "Apply for verification"}
                </Link>
              </GlassCard>
            </section>

            <section>
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold">WildSaura ecosystem access</h2>
                  <p className="text-gray-400 text-sm">Identity.wildsaura works as the verification zone for the connected WildSaura sites.</p>
                </div>
                <Link href="/apps" className="text-sm text-purple-300 hover:text-purple-100">Manage apps</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                {CONNECTED_APPS.map((app) => {
                  const connected = isAppConnected(identity?.connectedApps || {}, app.id);
                  return (
                    <a key={app.id} href={app.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.08] transition">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold">{app.name}</p>
                        <span className={`text-xs rounded-full px-2 py-1 ${connected ? "bg-emerald-500/15 text-emerald-300" : "bg-gray-500/15 text-gray-400"}`}>
                          {connected ? "Connected" : "Ready"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-3">{appDescriptions[app.id]}</p>
                    </a>
                  );
                })}
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GlassCard>
                <h2 className="text-xl font-bold mb-4">Security</h2>
                <div className="space-y-3 text-sm">
                  <Info label="Auth providers" value={user?.providerData.map((p) => p.providerId).join(", ") || "—"} />
                  <Info label="Email verified" value={user?.emailVerified ? "Yes" : "No"} />
                  <Link href="/security" className="inline-block text-purple-300 hover:text-purple-100">Manage password settings</Link>
                </div>
              </GlassCard>

              <GlassCard className="lg:col-span-2">
                <h2 className="text-xl font-bold mb-4">Recent sessions</h2>
                {sessions.length ? (
                  <div className="space-y-3">
                    {sessions.slice(0, 4).map((session) => (
                      <div key={session.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white/5 p-3 text-sm gap-2">
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
            </section>
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-lg font-bold text-white mt-1">{value}</p>
    </div>
  );
}

function StatusRow({ label, value, className = "text-gray-100" }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-400">{label}</span>
      <span className={`font-semibold text-right ${className}`}>{value || "—"}</span>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <dt className="text-gray-400 text-xs uppercase tracking-wide">{label}</dt>
      <dd className="text-gray-100 break-words mt-1">{value || "—"}</dd>
    </div>
  );
}
