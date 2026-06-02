"use client";
import { useRouter } from "next/navigation";
import { AuthPage } from "@/components/auth";
import { getIdentityClaims } from "@/lib/adminClaims";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const handleAuthSuccess = async () => {
    const user = auth.currentUser;
    const claims = await getIdentityClaims(user);
    if (claims.admin || claims.verificationReviewer) {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  };

  return <AuthPage onAuthSuccess={handleAuthSuccess} />;
}
