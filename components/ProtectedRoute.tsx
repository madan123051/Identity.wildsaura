"use client";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Spinner = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-white" />
  </div>
);

/** Protects any route that requires a logged-in user. */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return <Spinner />;

  return <>{children}</>;
}

/** Protects routes that require admin or verification reviewer custom claims. */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, isVerificationReviewer } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    } else if (!isAdmin && !isVerificationReviewer) {
      router.push("/dashboard");
    }
  }, [user, loading, isAdmin, isVerificationReviewer, router]);

  if (loading || !user || (!isAdmin && !isVerificationReviewer)) return <Spinner />;

  return <>{children}</>;
}
