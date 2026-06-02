"use client";
import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/GlassCard";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <GlassCard className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">WildSaura</h1>
        <p className="text-gray-400 text-center mb-6">
          {isSignUp ? "Create your identity" : "Sign in to your identity"}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-purple-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-purple-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition"
          >
            {isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>
        <button
          className="mt-4 text-sm text-gray-400 hover:text-white w-full text-center"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? "Already have an account? Sign in" : "New here? Create account"}
        </button>
      </GlassCard>
    </div>
  );
}