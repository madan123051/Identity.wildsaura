"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/authContext";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

type UserData = {
  displayName?: string;
  photoURL?: string;
  verified?: boolean;
  verificationStatus?: "not_started" | "pending" | "approved" | "rejected";
  connectedApps?: { [key: string]: boolean };
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setUserData(snap.data() as UserData);
    };
    fetchUser();
  }, [user]);

  const status = userData?.verificationStatus || "not_started";
  const statusColors: Record<string, string> = {
    not_started: "text-gray-400",
    pending: "text-yellow-400",
    approved: "text-green-400",
    rejected: "text-red-400",
  };

  return (
    // ProtectedRoute now auto-redirects admin → /admin
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-4xl mx-auto p-4 pt-24">
        <GlassCard className="mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img
              src={user?.photoURL || "/default-avatar.png"}
              alt="avatar"
              className="w-20 h-20 rounded-full border-2 border-purple-500"
            />
            <div>
              <h2 className="text-2xl font-bold">
                {userData?.displayName || user?.email}
              </h2>
              <p className={`text-sm font-medium ${statusColors[status]}`}>
                Verification: {status.replace("_", " ")}
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

        <GlassCard>
          <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
          <p className="text-gray-400 text-sm">No recent activity yet.</p>
        </GlassCard>
      </main>
    </ProtectedRoute>
  );
}
