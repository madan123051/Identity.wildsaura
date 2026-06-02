"use client";
import { useState } from "react";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleChangePassword = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) return;
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setMessage("Password updated successfully.");
    } catch (err: any) {
      setMessage("Error: " + err.message);
    }
  };

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-md mx-auto p-4 pt-24">
        <GlassCard>
          <h1 className="text-2xl font-bold mb-6">Security Settings</h1>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Current password"
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-purple-500"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="New password"
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-purple-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              onClick={handleChangePassword}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
            >
              Update Password
            </button>
            {message && <p className="text-sm text-center mt-2">{message}</p>}
          </div>
        </GlassCard>
      </main>
    </ProtectedRoute>
  );
}