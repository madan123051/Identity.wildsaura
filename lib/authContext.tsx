"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "./firebase";
import { getIdentityClaims, type IdentityClaims } from "./adminClaims";
import { registerConnectedApp } from "./connectedApps";
import { touchIdentitySession } from "./sessions";

const EMPTY_CLAIMS: IdentityClaims = { admin: false, verificationReviewer: false };

type AuthContextType = {
  user: User | null;
  loading: boolean;
  claims: IdentityClaims;
  isAdmin: boolean;
  canReviewVerification: boolean;
  refreshClaims: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  claims: EMPTY_CLAIMS,
  isAdmin: false,
  canReviewVerification: false,
  refreshClaims: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<IdentityClaims>(EMPTY_CLAIMS);
  const [loading, setLoading] = useState(true);

  const refreshClaims = async () => {
    const current = auth.currentUser;
    if (!current) {
      setClaims(EMPTY_CLAIMS);
      return;
    }
    setClaims(await getIdentityClaims(current));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      if (!firebaseUser) {
        setClaims(EMPTY_CLAIMS);
        setLoading(false);
        return;
      }

      try {
        const nextClaims = await getIdentityClaims(firebaseUser);
        setClaims(nextClaims);
        await Promise.allSettled([
          registerConnectedApp(db, firebaseUser.uid, "identity"),
          touchIdentitySession(db, firebaseUser.uid),
        ]);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const isAdmin = claims.admin;
  const canReviewVerification = claims.admin || claims.verificationReviewer;

  return (
    <AuthContext.Provider value={{ user, loading, claims, isAdmin, canReviewVerification, refreshClaims }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
