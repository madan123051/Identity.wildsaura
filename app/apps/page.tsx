"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/authContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { CONNECTED_APPS, registerConnectedApp } from "@/lib/connectedApps";
import { ConnectedAppId, getIdentityProfile, IdentityProfile, isAppConnected } from "@/lib/identity";

const APP_DESCRIPTIONS: Partial<Record<ConnectedAppId, string>> = {
  identity: "Central login, profile, and verification hub for the WildSaura ecosystem.",
  market: "Trusted eco-commerce — buy and sell with verified WildSaura identity.",
  drishya: "Creator and community identity for nature stories and visual content.",
  community: "WildSaura social hub — join conservation circles and discussions.",
  creator: "Creator profile, portfolio, and verified collaboration opportunities.",
};

const APP_ICONS: Partial<Record<ConnectedAppId, string>> = {
  identity: "🆔",
  market: "🛒",
  drishya: "🎬",
  community: "🌿",
  creator: "✨",
};

export default function AppsPage() {
  const { user } = useAuth();
  const [identity, setIdentity] = useState<IdentityProfile | null>(null);
  const [connecting, setConnecting] = useState<ConnectedAppId | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      await registerConnectedApp(db, user.uid, "identity");
      setIdentity(await getIdentityProfile(db, user.uid, user));
    })();
  }, [user]);

  const handleConnect = async (appId: ConnectedAppId, appUrl: string) => {
    if (!user) return;
    setConnecting(appId);
    try {
      await registerConnectedApp(db, user.uid, appId);
      // Refresh identity to reflect the new connection
      const updated = await getIdentityProfile(db, user.uid, user);
      setIdentity(updated);
      // Open the app in a new tab after connecting
      window.open(appUrl, "_blank", "noopener,noreferrer");
    } catch {
      // silently fail — connection can be retried
    } finally {
      setConnecting(null);
    }
  };

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-36 lg:pt-28 pb-12 space-y-6">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.3em] text-purple-200">Ecosystem Junction</p>
          <h1 className="text-2xl font-bold mt-2">Connected Apps</h1>
          <p className="text-gray-400 text-sm mt-2">
            Your WildSaura identity works across all ecosystem apps. Connect an app to link your verified profile there.
          </p>
        </GlassCard>

        <GlassCard>
          <div className="space-y-4">
            {CONNECTED_APPS.map((app) => {
              const connected = isAppConnected(identity?.connectedApps || {}, app.id);
              const isConnecting = connecting === app.id;
              const icon = APP_ICONS[app.id] || "🔗";
              const description = APP_DESCRIPTIONS[app.id] || "";

              return (
                <div
                  key={app.id}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.07] transition"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
                    {icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold hover:text-purple-300 transition"
                      >
                        {app.name}
                      </a>
                      {connected && (
                        <span className="rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs px-2 py-0.5 font-semibold">
                          ✓ Connected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{description}</p>
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0">
                    {connected ? (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-semibold transition"
                      >
                        Open ↗
                      </a>
                    ) : (
                      <button
                        onClick={() => handleConnect(app.id, app.url)}
                        disabled={isConnecting}
                        className="rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold transition"
                      >
                        {isConnecting ? "Connecting…" : "Connect"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <p className="text-center text-xs text-gray-500 px-4">
          Connecting an app registers your WildSaura identity there and opens the site so you can sign in.
        </p>
      </main>
    </ProtectedRoute>
  );
}
