"use client";
import { useRouter } from "next/navigation";
import { AuthPage } from "@/components/auth";
import { auth } from "@/lib/firebase";

const ADMIN_EMAIL = "madan123050@gmail.com";

export default function LoginPage() {
  const router = useRouter();

  const handleAuthSuccess = () => {
    const user = auth.currentUser;
    if (user?.email === ADMIN_EMAIL) {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  };

  return <AuthPage onAuthSuccess={handleAuthSuccess} />;
}
