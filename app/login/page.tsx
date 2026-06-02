"use client";
import { useRouter } from "next/navigation";
import { AuthPage } from "@/components/auth";

export default function LoginPage() {
  const router = useRouter();

  const handleAuthSuccess = () => {
    router.push("/dashboard");
  };

  return <AuthPage onAuthSuccess={handleAuthSuccess} />;
}
