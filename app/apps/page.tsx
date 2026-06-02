"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/authContext";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const APPS = [
  { id: "market", name: "Market", url: "https://market.wildsaura.com" },
  { id: "drishya", name: "Drishya", url: "https://drishya.wildsaura.com" },
  { id: "community", name: "Community", url: "https://community.wildsaura.com" },
  { id: "creator", name: "Creator Hub", url: "https://creator.wildsaura.com" },
];

export default function AppsPage() {
  const { user } = useAuth();
  const [connected, setConnected] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setConnected(snap.data().connectedApps || {});
      }
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
            {APPS.map((app) => (
              <div
                key={app.id}
                className="flex justify-between items-center p-3 bg-white/5 rounded-lg"
              >
                <span>{app.name}</span>
                <span>
                  {connected[app.id] ? (
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