"use client";
import { useRouter } from "next/navigation";
import { AuthPage } from "@/components/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const handleAuthSuccess = async () => {
    const user = auth.currentUser;
    const claims = user ? (await user.getIdTokenResult(true)).claims : {};
    if (claims.admin === true || claims.verificationReviewer === true) {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  };

  return <AuthPage onAuthSuccess={handleAuthSuccess} />;
}
