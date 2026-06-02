"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isVerificationReviewer: boolean;
  claims: Record<string, unknown>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isVerificationReviewer: false,
  claims: {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setClaims({});
        setLoading(false);
        return;
      }

      try {
        const token = await firebaseUser.getIdTokenResult(true);
        setClaims(token.claims);
      } catch {
        setClaims({});
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const isAdmin = claims.admin === true;
  const isVerificationReviewer = isAdmin || claims.verificationReviewer === true;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isVerificationReviewer, claims }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
