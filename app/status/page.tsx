"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/authContext";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function StatusPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>("not_started");
  const [verifData, setVerifData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) setStatus(userDoc.data().verificationStatus || "not_started");
      const verifDoc = await getDoc(doc(db, "verifications", user.uid));
      if (verifDoc.exists()) setVerifData(verifDoc.data());
    })();
  }, [user]);

  const statusMap = {
    not_started: { color: "text-gray-400", icon: "⭕", text: "Not Started" },
    pending: { color: "text-yellow-400", icon: "⏳", text: "Pending" },
    approved: { color: "text-green-400", icon: "✅", text: "Approved" },
    rejected: { color: "text-red-400", icon: "❌", text: "Rejected" },
  };

  const current = statusMap[status as keyof typeof statusMap] || statusMap.not_started;

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
              <p>Submitted: {verifData.submittedAt?.toDate().toLocaleDateString()}</p>
              {verifData.reviewedAt && (
                <p>Reviewed: {verifData.reviewedAt.toDate().toLocaleDateString()}</p>
              )}
            </div>
          )}
        </GlassCard>
      </main>
    </ProtectedRoute>
  );
}