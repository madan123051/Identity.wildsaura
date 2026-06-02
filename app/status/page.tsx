"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/authContext";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getIdentityProfile, normalizeVerificationStatus, type VerificationStatus } from "@/lib/identity";

const statusMap: Record<VerificationStatus, { color: string; icon: string; text: string }> = {
  not_started: { color: "text-gray-400", icon: "⭕", text: "Not Started" },
  pending: { color: "text-yellow-400", icon: "⏳", text: "Pending" },
  verified: { color: "text-green-400", icon: "✅", text: "Verified" },
  rejected: { color: "text-red-400", icon: "❌", text: "Rejected" },
};

export default function StatusPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<VerificationStatus>("not_started");
  const [verifData, setVerifData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [identity, verifDoc] = await Promise.all([
        getIdentityProfile(db, user.uid, user),
        getDoc(doc(db, "verifications", user.uid)),
      ]);
      const requestData = verifDoc.exists() ? verifDoc.data() : null;
      setStatus(normalizeVerificationStatus(identity.verificationStatus || requestData?.status, identity.verified));
      setVerifData(requestData);
    })();
  }, [user]);

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
          {verifData && (
            <div className="text-sm text-gray-400 space-y-1">
              <p>Submitted: {verifData.submittedAt?.toDate?.().toLocaleDateString?.() || "—"}</p>
              {verifData.reviewedAt && (
                <p>Reviewed: {verifData.reviewedAt.toDate?.().toLocaleDateString?.() || "—"}</p>
              )}
            </div>
          )}
        </GlassCard>
      </main>
    </ProtectedRoute>
  );
}
