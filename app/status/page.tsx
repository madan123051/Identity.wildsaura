"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/authContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { getIdentityProfile, IdentityProfile, formatFirebaseDate } from "@/lib/identity";

const statusMap = {
  not_started: { color: "text-gray-400", icon: "⭕", text: "Not Started" },
  pending: { color: "text-yellow-400", icon: "⏳", text: "Pending" },
  verified: { color: "text-green-400", icon: "✅", text: "Verified" },
  rejected: { color: "text-red-400", icon: "❌", text: "Rejected" },
};

export default function StatusPage() {
  const { user } = useAuth();
  const [identity, setIdentity] = useState<IdentityProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    getIdentityProfile(db, user.uid, user).then(setIdentity);
  }, [user]);

  const status = identity?.verificationStatus || "not_started";
  const current = statusMap[status] || statusMap.not_started;

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
            <p>Submitted: {formatFirebaseDate(identity?.submittedAt)}</p>
            <p>Reviewed: {formatFirebaseDate(identity?.reviewedAt)}</p>
            {identity?.documentUrl && (
              <p>
                Document: <a href={identity.documentUrl} className="text-purple-300 underline" target="_blank" rel="noreferrer">View</a>
              </p>
            )}
          </div>
        </GlassCard>
      </main>
    </ProtectedRoute>
  );
}
