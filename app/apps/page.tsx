"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/authContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { getIdentityProfile } from "@/lib/identity";
import { normalizeConnectedApps, registerConnectedApp, type ConnectedAppRecord } from "@/lib/connectedApps";

const APPS = [
  { id: "identity", name: "Identity", url: "https://identity.wildsaura.com" },
  { id: "market", name: "Market", url: "https://market.wildsaura.com" },
  { id: "drishya", name: "Drishya", url: "https://drishya.wildsaura.com" },
  { id: "community", name: "Community", url: "https://community.wildsaura.com" },
  { id: "creator", name: "Creator Hub", url: "https://creator.wildsaura.com" },
] as const;

function formatDate(value: any) {
  if (!value) return "—";
  return value.toDate?.().toLocaleDateString?.() || "—";
}

export default function AppsPage() {
  const { user } = useAuth();
  const [connected, setConnected] = useState<Record<string, ConnectedAppRecord>>(normalizeConnectedApps());

  useEffect(() => {
    if (!user) return;
    (async () => {
      await registerConnectedApp(db, user.uid, "identity");
      const identity = await getIdentityProfile(db, user);
      setConnected(identity.connectedApps);
    })();
  }, [user]);

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-xl mx-auto p-4 pt-24">
        <GlassCard>
          <h1 className="text-2xl font-bold mb-4">Connected Apps</h1>
          <p className="text-gray-400 text-sm mb-6">
            Apps you have used with your WildSaura identity.
          </p>
          <div className="space-y-3">
            {APPS.map((app) => {
              const appState = connected[app.id];
              return (
                <div
                  key={app.id}
                  className="flex justify-between items-center p-3 bg-white/5 rounded-lg"
                >
                  <div>
                    <a href={app.url} className="font-medium hover:text-purple-300">{app.name}</a>
                    <p className="text-xs text-gray-500">Last seen: {formatDate(appState?.lastSeen)}</p>
                  </div>
                  <span>
                    {appState?.connected ? (
                      <span className="text-green-400">✔ Connected</span>
                    ) : (
                      <span className="text-gray-500">— Not yet</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </main>
    </ProtectedRoute>
  );
}
