"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "./firebase";
import { getIdentityClaims, IdentityClaims } from "./adminClaims";
import { registerConnectedApp } from "./connectedApps";
import { touchIdentitySession } from "./sessions";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  canReviewVerification: boolean;
  claims: IdentityClaims;
};

const defaultClaims: IdentityClaims = {
  admin: false,
  verificationReviewer: false,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  canReviewVerification: false,
  claims: defaultClaims,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<IdentityClaims>(defaultClaims);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setClaims(defaultClaims);
        setLoading(false);
        return;
      }

      try {
        const nextClaims = await getIdentityClaims(firebaseUser);
        setClaims(nextClaims);
        await Promise.allSettled([
          registerConnectedApp(db, firebaseUser.uid, 'identity'),
          touchIdentitySession(db, firebaseUser.uid),
        ]);
      } catch {
        setClaims(defaultClaims);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const isAdmin = claims.admin;
  const canReviewVerification = claims.admin || claims.verificationReviewer;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, canReviewVerification, claims }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
