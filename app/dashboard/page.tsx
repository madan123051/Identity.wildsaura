"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/authContext";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { getIdentityProfile, type IdentityProfile, type VerificationStatus } from "@/lib/identity";
import { CONNECTED_APPS, isAppConnected } from "@/lib/connectedApps";
import { getIdentitySessions, type IdentitySession } from "@/lib/sessions";

type VerificationData = {
  documentUrl?: string;
  documentURL?: string;
  submittedAt?: any;
  reviewedAt?: any;
  status?: string;
};

const statusColors: Record<VerificationStatus, string> = {
  not_started: "text-gray-400",
  pending: "text-yellow-400",
  verified: "text-green-400",
  rejected: "text-red-400",
};

const statusLabels: Record<VerificationStatus, string> = {
  not_started: "Not started",
  pending: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
};

function formatDate(value: any) {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "—";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [identity, setIdentity] = useState<IdentityProfile | null>(null);
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [sessions, setSessions] = useState<IdentitySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [profile, verifSnap, sessionList] = await Promise.all([
          getIdentityProfile(db, user.uid, user),
          getDoc(doc(db, "verifications", user.uid)),
          getIdentitySessions(db, user.uid).catch(() => []),
        ]);
        setIdentity(profile);
        setVerification(verifSnap.exists() ? verifSnap.data() : null);
        setSessions(sessionList);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  const status = identity?.verificationStatus || "not_started";
  const documentUrl = verification?.documentUrl || verification?.documentURL || identity?.rawProfile?.id_proof_url;

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-5xl mx-auto p-4 pt-24 space-y-6">
        <GlassCard>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img
              src={identity?.photoURL || user?.photoURL || "/default-avatar.png"}
              alt="avatar"
              className="w-20 h-20 rounded-full border-2 border-purple-500 object-cover"
            />
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold">{identity?.displayName || user?.email}</h1>
              <p className="text-gray-400">{identity?.email || user?.email}</p>
              <p className={`text-sm font-semibold ${statusColors[status]}`}>
                Verification: {statusLabels[status]}
              </p>
            </div>
          </div>
        </GlassCard>

        {loading ? (
          <GlassCard><p className="text-gray-400">Loading existing Firebase data...</p></GlassCard>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard>
                <h2 className="text-xl font-semibold mb-4">Profile</h2>
                <div className="space-y-2 text-sm text-gray-300">
                  <p><span className="text-gray-500">Username:</span> {identity?.username || "—"}</p>
                  <p><span className="text-gray-500">Phone:</span> {identity?.phone || "—"}</p>
                  <p><span className="text-gray-500">Address:</span> {identity?.address || "—"}</p>
                  <p><span className="text-gray-500">Province:</span> {identity?.province || "—"}</p>
                  <p><span className="text-gray-500">Country:</span> {identity?.country || "—"}</p>
                </div>
              </GlassCard>

              <GlassCard>
                <h2 className="text-xl font-semibold mb-4">Verification</h2>
                <p className={`font-semibold ${statusColors[status]}`}>{statusLabels[status]}</p>
                <div className="mt-3 flex gap-3">
                  <Link href="/verify" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold">
                    Submit / Update
                  </Link>
                  <Link href="/status" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold">
                    View Status
                  </Link>
                </div>
              </GlassCard>
            </div>

            <GlassCard>
              <h2 className="text-xl font-semibold mb-4">Documents</h2>
              {documentUrl ? (
                <a href={documentUrl} target="_blank" rel="noreferrer" className="text-purple-400 underline">
                  View submitted document
                </a>
              ) : (
                <p className="text-gray-400 text-sm">No verification document found.</p>
              )}
              <div className="text-sm text-gray-400 mt-3 space-y-1">
                <p>Submitted: {formatDate(verification?.submittedAt)}</p>
                <p>Reviewed: {formatDate(verification?.reviewedAt)}</p>
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-xl font-semibold mb-4">Connected Apps</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {CONNECTED_APPS.map((app) => {
                  const value = identity?.connectedApps?.[app.id];
                  return (
                    <div key={app.id} className="p-3 bg-white/5 rounded-lg">
                      <p className="font-medium">{app.name}</p>
                      <p className={isAppConnected(value) ? "text-green-400 text-sm" : "text-gray-500 text-sm"}>
                        {isAppConnected(value) ? "Connected" : "Not yet"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-xl font-semibold mb-4">Sessions</h2>
              {sessions.length ? (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div key={session.id} className="p-3 bg-white/5 rounded-lg text-sm">
                      <p className="font-medium">{session.device} · {session.browser}</p>
                      <p className="text-gray-400">{session.platform}</p>
                      <p className="text-gray-500">Last seen: {formatDate(session.lastSeen)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No active sessions recorded yet.</p>
              )}
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard>
                <h2 className="text-xl font-semibold mb-4">Activity</h2>
                <p className="text-gray-400 text-sm">Identity loaded from Firebase Auth, users, profiles, and verifications records.</p>
              </GlassCard>
              <GlassCard>
                <h2 className="text-xl font-semibold mb-4">Security</h2>
                <Link href="/security" className="text-purple-400 underline">Manage password and security settings</Link>
              </GlassCard>
            </div>
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
