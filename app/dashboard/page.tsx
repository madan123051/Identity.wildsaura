"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/authContext";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
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
    message: "Your WildSaura identity is verified across the ecosystem.",
  },
  rejected: {
    label: "Rejected",
    tone: "text-red-300",
    badge: "bg-red-500/15 border-red-400/30 text-red-200",
    message: "Your last request needs correction. Review your info and resubmit.",
  },
};

const appDescriptions: Partial<Record<ConnectedAppId, string>> = {
  identity: "Central login, profile, and verification junction.",
  market: "Trusted seller, buyer, and eco-commerce access.",
  drishya: "Creator and community identity for nature stories.",
  community: "WildSaura social and conservation participation.",
  creator: "Creator profile, portfolio, and verified opportunities.",
};

const TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    id: "verification",
    label: "Verification",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12l2 2 4-4" />
        <path d="M12 2l3 3h4v4l3 3-3 3v4h-4l-3 3-3-3H5v-4L2 12l3-3V5h4z" />
      </svg>
    ),
  },
  {
    id: "apps",
    label: "Apps",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="6" cy="6" r="2" />
        <circle cx="12" cy="6" r="2" />
        <circle cx="18" cy="6" r="2" />
        <circle cx="6" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="18" cy="12" r="2" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="12" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    ),
  },
  {
    id: "sessions",
    label: "Sessions",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    id: "security",
    label: "Security",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10C7.5 20.5 4 17 4 12V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function DashboardPage() {
  const { user, canReviewVerification } = useAuth();
  const [identity, setIdentity] = useState<IdentityProfile | null>(null);
  const [sessions, setSessions] = useState<IdentitySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

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
    return () => { alive = false; };
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

  const connectedCount = CONNECTED_APPS.filter((app) =>
    isAppConnected(identity?.connectedApps || {}, app.id)
  ).length;

  return (
    <ProtectedRoute>
      <main className="max-w-4xl mx-auto px-4 pt-8 pb-16">
        {/* Hero header */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={identity?.photoURL || user?.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(identity?.displayName || "WS")}`}
            alt="Avatar"
            className="w-14 h-14 rounded-2xl border border-purple-300/30 object-cover bg-white/10 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-widest text-purple-300 mb-1">WildSaura Identity</p>
            <h1 className="text-2xl font-black truncate">
              {identity?.displayName || user?.email || "WildSaura User"}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold ${meta.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status === "verified" ? "bg-emerald-400" : status === "pending" ? "bg-amber-400" : status === "rejected" ? "bg-red-400" : "bg-gray-400"}`} />
                {meta.label}
              </span>
              <span className="text-xs text-gray-500">{completion}% complete</span>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {canReviewVerification && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-sm font-semibold hover:bg-amber-500/25 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10C7.5 20.5 4 17 4 12V6z" />
                </svg>
                Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-semibold hover:bg-white/10 hover:text-white transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-6 no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-purple-600/30 border border-purple-500/50 text-purple-200"
                  : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {loading ? (
          <GlassCard>
            <div className="flex items-center gap-3 text-gray-400">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Loading your identity...
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {activeTab === "overview" && <OverviewTab identity={identity} user={user} status={status} meta={meta} completion={completion} connectedCount={connectedCount} sessions={sessions} />}
            {activeTab === "profile" && <ProfileTab identity={identity} user={user} />}
            {activeTab === "verification" && <VerificationTab identity={identity} status={status} meta={meta} />}
            {activeTab === "apps" && <AppsTab identity={identity} />}
            {activeTab === "sessions" && <SessionsTab sessions={sessions} />}
            {activeTab === "security" && <SecurityTab user={user} />}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}

// ─── Collapse wrapper ────────────────────────────────────────────────
function Collapse({ title, subtitle, defaultOpen = false, children, accent }: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  accent?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-2xl border transition-all ${
      open ? "border-purple-500/30 bg-white/[0.06]" : "border-white/10 bg-white/[0.03]"
    }`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div>
          <p className={`font-semibold ${accent || "text-gray-100"}`}>{title}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────
function OverviewTab({ identity, user, status, meta, completion, connectedCount, sessions }: any) {
  return (
    <>
      {/* Completion bar */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-200">Identity readiness</p>
          <p className="text-sm font-black text-purple-300">{completion}%</p>
        </div>
        <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Pill label="Apps" value={`${connectedCount}/${5}`} color="purple" />
          <Pill label="Sessions" value={`${sessions.length}`} color="blue" />
          <Pill label="Status" value={meta.label} color={status === "verified" ? "green" : status === "pending" ? "amber" : "gray"} />
        </div>
      </div>

      {/* Quick info */}
      <Collapse title="Account info" subtitle={identity?.email || user?.email} defaultOpen>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <InfoCell label="Email" value={identity?.email || user?.email || "—"} />
          <InfoCell label="Username" value={identity?.username ? `@${identity.username}` : "—"} />
          <InfoCell label="Phone" value={identity?.phone || "—"} />
          <InfoCell label="Country" value={identity?.country || "—"} />
          <InfoCell label="Email verified" value={user?.emailVerified ? "Yes" : "No"} />
          <InfoCell label="Auth method" value={user?.providerData?.map((p: any) => p.providerId).join(", ") || "—"} />
        </dl>
      </Collapse>

      {/* Status */}
      <Collapse title="Verification status" subtitle={meta.label}>
        <p className="text-sm text-gray-300 mb-4">{meta.message}</p>
        <Link
          href="/verify"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 font-semibold text-sm transition"
        >
          {status === "verified" ? "View verified profile" : status === "pending" ? "Review submission" : status === "rejected" ? "Resubmit" : "Apply for verification"}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </Collapse>
    </>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────────────
function ProfileTab({ identity, user }: any) {
  return (
    <>
      <Collapse title="Personal details" subtitle="Name, gender, date of birth" defaultOpen>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <InfoCell label="Full name" value={identity?.displayName || user?.displayName || "—"} />
          <InfoCell label="Username" value={identity?.username ? `@${identity.username}` : "—"} />
          <InfoCell label="Gender" value={identity?.gender || "—"} />
          <InfoCell label="Date of birth" value={identity?.dateOfBirth || "—"} />
        </dl>
        <Link href="/profile" className="mt-4 inline-flex items-center gap-2 text-sm text-purple-300 hover:text-purple-100">
          Edit personal details
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </Link>
      </Collapse>

      <Collapse title="Contact &amp; location" subtitle="Phone, address, province, country">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <InfoCell label="Phone" value={identity?.phone || "—"} />
          <InfoCell label="Address" value={identity?.address || "—"} />
          <InfoCell label="Province" value={identity?.province || "—"} />
          <InfoCell label="Country" value={identity?.country || "—"} />
        </dl>
        <Link href="/profile" className="mt-4 inline-flex items-center gap-2 text-sm text-purple-300 hover:text-purple-100">
          Edit contact details
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </Link>
      </Collapse>

      <Collapse title="Account metadata" subtitle="UID, source, creation info">
        <dl className="grid grid-cols-1 gap-3 text-sm">
          <InfoCell label="UID" value={identity?.uid || "—"} mono />
          <InfoCell label="Email" value={identity?.email || user?.email || "—"} />
          <InfoCell label="Source" value={identity?.source || "auth"} />
          <InfoCell label="Email verified" value={user?.emailVerified ? "Yes" : "No"} />
        </dl>
      </Collapse>
    </>
  );
}

// ─── Verification Tab ────────────────────────────────────────────────
function VerificationTab({ identity, status, meta }: any) {
  return (
    <>
      <div className={`rounded-2xl border px-5 py-4 ${meta.badge}`}>
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4" />
            <path d="M12 2l3 3h4v4l3 3-3 3v4h-4l-3 3-3-3H5v-4L2 12l3-3V5h4z" />
          </svg>
          <div>
            <p className="font-bold">{meta.label}</p>
            <p className="text-sm opacity-80 mt-1">{meta.message}</p>
          </div>
        </div>
      </div>

      <Collapse title="Verification timeline" subtitle="Submission and review dates" defaultOpen>
        <dl className="space-y-3 text-sm">
          <InfoCell label="Submitted" value={formatFirebaseDate(identity?.submittedAt)} />
          <InfoCell label="Reviewed" value={formatFirebaseDate(identity?.reviewedAt)} />
          <InfoCell label="Verified flag" value={identity?.verified ? "Yes" : "No"} />
          <InfoCell label="Current status" value={meta.label} />
        </dl>
        <Link
          href="/verify"
          className="mt-5 flex items-center justify-center gap-2 w-full rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-3 font-semibold text-sm transition"
        >
          {status === "rejected" ? "Resubmit verification" : status === "pending" ? "Review submission" : status === "verified" ? "View verified profile" : "Apply for verification"}
        </Link>
      </Collapse>

      <Collapse title="What verification unlocks">
        <ul className="space-y-2 text-sm text-gray-300">
          {["Trusted buyer & seller on WildSaura Market", "Verified creator profile on Drishya", "Community conservation participation", "Full ecosystem access across all WildSaura apps"].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </Collapse>
    </>
  );
}

// ─── Apps Tab ────────────────────────────────────────────────────────
function AppsTab({ identity }: any) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CONNECTED_APPS.map((app) => {
          const connected = isAppConnected(identity?.connectedApps || {}, app.id);
          return (
            <a
              key={app.id}
              href={app.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.08] hover:border-purple-500/30 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold">{app.name}</p>
                  <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${
                    connected ? "bg-emerald-500/15 text-emerald-300" : "bg-gray-500/15 text-gray-400"
                  }`}>
                    {connected ? "Connected" : "Ready"}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {(appDescriptions as any)[app.id] || "WildSaura ecosystem app."}
                </p>
              </div>
            </a>
          );
        })}
      </div>
      <Link href="/apps" className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] py-3 text-sm text-purple-300 hover:text-purple-100 hover:bg-white/[0.06] transition">
        Manage connected apps
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
      </Link>
    </>
  );
}

// ─── Sessions Tab ────────────────────────────────────────────────────
function SessionsTab({ sessions }: { sessions: IdentitySession[] }) {
  if (!sessions.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 flex flex-col items-center gap-3 text-gray-400">
        <svg className="w-8 h-8 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
        <p className="text-sm">No active sessions recorded yet.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <Collapse
          key={session.id}
          title={`${session.device} · ${session.browser}`}
          subtitle={`Last seen: ${formatFirebaseDate(session.lastSeen)}`}
        >
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <InfoCell label="Device" value={session.device} />
            <InfoCell label="Browser" value={session.browser} />
            <InfoCell label="Platform" value={session.platform} />
            <InfoCell label="Last seen" value={formatFirebaseDate(session.lastSeen)} />
          </dl>
        </Collapse>
      ))}
    </div>
  );
}

// ─── Security Tab ────────────────────────────────────────────────────
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

function SecurityTab({ user }: any) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!user?.email) return;
    setSaving(true);
    setMessage("");
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      await updatePassword(auth.currentUser!, newPassword);
      setMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setMessage(err.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const isEmailProvider = user?.providerData?.some((p: any) => p.providerId === "password");

  return (
    <>
      <Collapse title="Auth providers" subtitle={user?.providerData?.map((p: any) => p.providerId).join(", ")} defaultOpen>
        <dl className="space-y-3 text-sm">
          {user?.providerData?.map((p: any) => (
            <InfoCell key={p.providerId} label="Provider" value={p.providerId} />
          ))}
          <InfoCell label="Email verified" value={user?.emailVerified ? "Yes" : "No"} />
        </dl>
      </Collapse>

      {isEmailProvider && (
        <Collapse title="Change password">
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition"
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition"
            />
            {message && (
              <div className={`rounded-xl border p-3 text-sm ${
                message.includes("success") ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" : "border-red-400/30 bg-red-500/10 text-red-200"
              }`}>{message}</div>
            )}
            <button
              onClick={handleChangePassword}
              disabled={saving || !currentPassword || !newPassword}
              className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-3 text-sm font-semibold transition"
            >
              {saving ? "Updating..." : "Update password"}
            </button>
          </div>
        </Collapse>
      )}

      <Collapse title="Danger zone" accent="text-red-300">
        <p className="text-sm text-gray-400 mb-4">
          These actions are irreversible. Proceed with caution.
        </p>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm font-semibold hover:bg-red-500/20 transition">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
          </svg>
          Delete account
        </button>
      </Collapse>
    </>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────
function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2.5">
      <dt className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">{label}</dt>
      <dd className={`text-sm text-gray-100 break-all ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</dd>
    </div>
  );
}

function Pill({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    purple: "bg-purple-500/15 text-purple-200",
    blue: "bg-blue-500/15 text-blue-200",
    green: "bg-emerald-500/15 text-emerald-200",
    amber: "bg-amber-500/15 text-amber-200",
    gray: "bg-gray-500/15 text-gray-300",
  };
  return (
    <div className={`rounded-xl px-3 py-2 text-center ${colors[color] || colors.gray}`}>
      <p className="text-lg font-black">{value}</p>
      <p className="text-[10px] uppercase tracking-widest opacity-70 mt-0.5">{label}</p>
    </div>
  );
}
