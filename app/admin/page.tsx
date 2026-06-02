"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "madan1230555@gmail.com";

type VerificationStatus = "not_started" | "pending" | "approved" | "rejected";

type UserRecord = {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  verificationStatus: VerificationStatus;
  verified: boolean;
  connectedApps?: { [key: string]: boolean };
  updatedAt?: any;
};

type VerificationRecord = {
  uid: string;
  fullName?: string;
  country?: string;
  documentUrl?: string;
  status: VerificationStatus;
  submittedAt?: any;
  reviewedAt?: any;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [verifications, setVerifications] = useState<Record<string, VerificationRecord>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | VerificationStatus>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) return;
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersSnap, verifSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "verifications")),
      ]);

      const usersData: UserRecord[] = usersSnap.docs.map((d) => ({
        uid: d.id,
        verificationStatus: "not_started",
        verified: false,
        ...(d.data() as any),
      }));

      const verifData: Record<string, VerificationRecord> = {};
      verifSnap.docs.forEach((d) => {
        verifData[d.id] = { uid: d.id, status: "pending", ...(d.data() as any) };
      });

      setUsers(usersData);
      setVerifications(verifData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (uid: string) => {
    setActionLoading(uid + "_approve");
    try {
      await Promise.all([
        updateDoc(doc(db, "users", uid), {
          verificationStatus: "approved",
          verified: true,
          updatedAt: serverTimestamp(),
        }),
        updateDoc(doc(db, "verifications", uid), {
          status: "approved",
          reviewedAt: serverTimestamp(),
        }),
      ]);
      await fetchData();
    } catch (err) {
      alert("Error approving user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (uid: string) => {
    setActionLoading(uid + "_reject");
    try {
      await Promise.all([
        updateDoc(doc(db, "users", uid), {
          verificationStatus: "rejected",
          verified: false,
          updatedAt: serverTimestamp(),
        }),
        updateDoc(doc(db, "verifications", uid), {
          status: "rejected",
          reviewedAt: serverTimestamp(),
        }),
      ]);
      await fetchData();
    } catch (err) {
      alert("Error rejecting user");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      (u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.uid.includes(search));
    const matchFilter = filter === "all" || u.verificationStatus === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: users.length,
    verified: users.filter((u) => u.verificationStatus === "approved").length,
    pending: users.filter((u) => u.verificationStatus === "pending").length,
    rejected: users.filter((u) => u.verificationStatus === "rejected").length,
    notStarted: users.filter((u) => u.verificationStatus === "not_started").length,
  };

  const statusBadge = (status: VerificationStatus) => {
    const map: Record<VerificationStatus, string> = {
      approved: "bg-green-500/20 text-green-400 border border-green-500/30",
      pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      rejected: "bg-red-500/20 text-red-400 border border-red-500/30",
      not_started: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
    };
    return map[status] || map.not_started;
  };

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <Navbar />
        <main className="flex items-center justify-center min-h-screen">
          <GlassCard className="text-center max-w-md">
            <div className="text-5xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-gray-400">You do not have admin privileges.</p>
          </GlassCard>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-6xl mx-auto p-4 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">⚙️ Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">WildSaura Identity — User Management</p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold transition"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <GlassCard className="text-center py-4">
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400 mt-1">Total Users</div>
          </GlassCard>
          <GlassCard className="text-center py-4 cursor-pointer hover:bg-white/10" onClick={() => setFilter("approved")}>
            <div className="text-3xl font-bold text-green-400">{stats.verified}</div>
            <div className="text-sm text-gray-400 mt-1">✅ Verified</div>
          </GlassCard>
          <GlassCard className="text-center py-4 cursor-pointer hover:bg-white/10" onClick={() => setFilter("pending")}>
            <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-sm text-gray-400 mt-1">⏳ Pending</div>
          </GlassCard>
          <GlassCard className="text-center py-4 cursor-pointer hover:bg-white/10" onClick={() => setFilter("rejected")}>
            <div className="text-3xl font-bold text-red-400">{stats.rejected}</div>
            <div className="text-sm text-gray-400 mt-1">❌ Rejected</div>
          </GlassCard>
        </div>

        {/* Search & Filter */}
        <GlassCard className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="🔍 Search by name, email, or UID..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-purple-500 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex gap-2">
              {(["all", "pending", "approved", "rejected", "not_started"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition capitalize ${
                    filter === f
                      ? "bg-purple-600 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {f === "not_started" ? "Not Started" : f}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Users Table */}
        <GlassCard>
          <h2 className="text-lg font-semibold mb-4">
            Users ({filteredUsers.length})
          </h2>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No users found.</div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((u) => {
                const verif = verifications[u.uid];
                const isExpanded = selectedUser === u.uid;
                return (
                  <div key={u.uid} className="bg-white/5 rounded-xl overflow-hidden">
                    {/* User Row */}
                    <div
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition"
                      onClick={() => setSelectedUser(isExpanded ? null : u.uid)}
                    >
                      {/* Avatar */}
                      <img
                        src={u.photoURL || "/default-avatar.png"}
                        alt=""
                        className="w-10 h-10 rounded-full border border-white/10 flex-shrink-0"
                      />
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {u.displayName || verif?.fullName || "—"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{u.email || u.uid}</p>
                      </div>
                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(u.verificationStatus)}`}>
                        {u.verificationStatus.replace("_", " ")}
                      </span>
                      {/* Actions */}
                      {u.verificationStatus === "pending" && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleApprove(u.uid)}
                            disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-semibold disabled:opacity-50 transition"
                          >
                            {actionLoading === u.uid + "_approve" ? "..." : "✅ Approve"}
                          </button>
                          <button
                            onClick={() => handleReject(u.uid)}
                            disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold disabled:opacity-50 transition"
                          >
                            {actionLoading === u.uid + "_reject" ? "..." : "❌ Reject"}
                          </button>
                        </div>
                      )}
                      <span className="text-gray-600 text-sm">{isExpanded ? "▲" : "▼"}</span>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-white/10 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">UID</p>
                          <p className="font-mono text-xs text-gray-300 break-all">{u.uid}</p>
                        </div>
                        {verif?.fullName && (
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Full Name</p>
                            <p>{verif.fullName}</p>
                          </div>
                        )}
                        {verif?.country && (
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Country</p>
                            <p>{verif.country}</p>
                          </div>
                        )}
                        {verif?.documentUrl && (
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Document</p>
                            <a
                              href={verif.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 underline text-xs"
                            >
                              View Document 🔗
                            </a>
                          </div>
                        )}
                        {verif?.submittedAt && (
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Submitted</p>
                            <p className="text-xs">
                              {verif.submittedAt?.toDate?.()?.toLocaleString() || "—"}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Connected Apps</p>
                          <p className="text-xs">
                            {Object.keys(u.connectedApps || {}).length || 0} app(s)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </main>
    </ProtectedRoute>
  );
}