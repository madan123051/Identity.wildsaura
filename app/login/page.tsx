"use client";
import { useRouter } from "next/navigation";
import { AuthPage } from "@/components/auth";
import { getIdentityClaims } from "@/lib/adminClaims";
import { getIdentityProfile } from "@/lib/identity";
import { auth, db } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const handleAuthSuccess = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/dashboard");
      return;
    }

    // Check admin/reviewer claims first
    const claims = await getIdentityClaims(user);
    if (claims.admin || claims.verificationReviewer) {
      router.push("/admin");
      return;
    }

    // Check verification status — new users go to /verify first
    try {
      const profile = await getIdentityProfile(db, user.uid, user);
      const status = profile?.verificationStatus || "not_started";
      if (status === "not_started") {
        // New user — guide them through verification
        router.push("/verify");
      } else {
        // Returning user — go to dashboard
        router.push("/dashboard");
      }
    } catch {
      // Fallback to dashboard on error
      router.push("/dashboard");
    }
  };

  return <AuthPage onAuthSuccess={handleAuthSuccess} />;
}
