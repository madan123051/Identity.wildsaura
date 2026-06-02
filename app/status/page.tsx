"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/authContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { getIdentityProfile, type IdentityProfile } from "@/lib/identity";
import { getVerificationLabel, type VerificationStatus } from "@/lib/verification";

function formatDate(value: any) {
  if (!value) return "—";
  return value.toDate?.().toLocaleDateString?.() || value;
}

export default function StatusPage() {
  const { user } = useAuth();
  const [identity, setIdentity] = useState<IdentityProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setIdentity(await getIdentityProfile(db, user));
    })();
  }, [user]);

  const status = identity?.verificationStatus || "not_started";
  const statusMap: Record<VerificationStatus, { color: string; icon: string; text: string }> = {
    not_started: { color: "text-gray-400", icon: "⭕", text: getVerificationLabel("not_started") },
    pending: { color: "text-yellow-400", icon: "⏳", text: getVerificationLabel("pending") },
    verified: { color: "text-green-400", icon: "✅", text: getVerificationLabel("verified") },
    rejected: { color: "text-red-400", icon: "❌", text: getVerificationLabel("rejected") },
  };

  const current = statusMap[status];

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-lg mx-auto p-4 pt-24">
        <GlassCard>
          <h1 className="text-2xl font-bold mb-6">Verification Status</h1>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-4xl">{current.icon}</span>
            <span className={`text-xl font-semibold ${current.color}`}>{current.text}</span>
          </div>
          <div className="text-sm text-gray-400 space-y-1">
            <p>Submitted: {formatDate(identity?.submittedAt)}</p>
            <p>Reviewed: {formatDate(identity?.reviewedAt)}</p>
            <p>Document: {identity?.documentUrl ? "Attached" : "Not attached"}</p>
          </div>
        </GlassCard>
      </main>
    </ProtectedRoute>
  );
}
