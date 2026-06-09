"use client";
import { useAuth } from "@/lib/authContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, canReviewVerification } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/profile", label: "Profile" },
    { href: "/verify", label: "Verification" },
    { href: "/apps", label: "Apps" },
    { href: "/status", label: "Status" },
    { href: "/security", label: "Security" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-white/10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-purple-300 whitespace-nowrap">
            <Image src="/logo.png" alt="WildSaura" width={32} height={32} className="drop-shadow" />
            WildSaura ID
          </Link>
          {user && (
            <button
              onClick={handleLogout}
              className="lg:hidden text-sm text-gray-300 hover:text-white"
            >
              Logout
            </button>
          )}
        </div>

        {user && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-gray-300 hover:text-white transition">
                {link.label}
              </Link>
            ))}
            {canReviewVerification && (
              <Link href="/admin" className="text-amber-300 hover:text-amber-100 transition">
                Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="hidden lg:inline text-sm text-gray-300 hover:text-white"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
