"use client";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <GlassCard className="max-w-xl text-center">
        <h1 className="text-4xl font-bold mb-4">WildSaura Identity</h1>
        <p className="text-gray-300 mb-8">
          One identity for all WildSaura apps. Secure, simple, and seamless.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <button className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition">
              Get Started
            </button>
          </Link>
          <Link href="/login">
            <button className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition">
              Sign In
            </button>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}