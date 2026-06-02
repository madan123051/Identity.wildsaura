"use client";
import { useAuth } from "@/lib/authContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-white/10 px-4 py-3">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <Link href="/dashboard" className="font-bold text-xl text-purple-400">
          WildSaura ID
        </Link>
        <div className="flex items-center gap-4">
          {user && (
            <button
              onClick={handleLogout}
              className="text-sm text-gray-300 hover:text-white"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}