"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/authContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { CONNECTED_APPS, registerConnectedApp } from "@/lib/connectedApps";
import { getIdentityProfile, IdentityProfile, isAppConnected } from "@/lib/identity";

export default function AppsPage() {
  const { user } = useAuth();
  const [identity, setIdentity] = useState<IdentityProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      await registerConnectedApp(db, user.uid, "identity");
      setIdentity(await getIdentityProfile(db, user.uid, user));
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
            {CONNECTED_APPS.map((app) => (
              <div
                key={app.id}
                className="flex justify-between items-center p-3 bg-white/5 rounded-lg"
              >
                <a href={app.url} className="hover:text-purple-300">{app.name}</a>
                <span>
                  {isAppConnected(identity?.connectedApps || {}, app.id) ? (
                    <span className="text-green-400">✔ Connected</span>
                  ) : (
                    <span className="text-gray-500">— Not yet</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </main>
    </ProtectedRoute>
  );
}
