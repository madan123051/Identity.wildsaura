"use client";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Spinner = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-white" />
  </div>
);

/** Protects any route that requires a logged-in user (non-admin). */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    } else if (isAdmin) {
      // Admin landed on a user page — send them to their dashboard
      router.push("/admin");
    }
  }, [user, loading, isAdmin, router]);

  if (loading || !user || isAdmin) return <Spinner />;

  return <>{children}</>;
}

/** Protects routes that require admin access. */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    } else if (!isAdmin) {
      router.push("/dashboard");
    }
  }, [user, loading, isAdmin, router]);

  if (loading || !user || !isAdmin) return <Spinner />;

  return <>{children}</>;
}
