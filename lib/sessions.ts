import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Firestore,
} from "firebase/firestore";

const SESSION_KEY = "wildsaura_identity_session_id";

export type IdentitySession = {
  id: string;
  device: string;
  browser: string;
  platform: string;
  createdAt?: any;
  lastSeen?: any;
  active?: boolean;
};

function getOrCreateSessionId() {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, next);
  return next;
}

function parseBrowser(userAgent: string) {
  if (/Edg\//.test(userAgent)) return "Edge";
  if (/Chrome\//.test(userAgent)) return "Chrome";
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return "Safari";
  if (/Firefox\//.test(userAgent)) return "Firefox";
  return "Unknown browser";
}

function getDeviceInfo() {
  if (typeof navigator === "undefined") {
    return { device: "Unknown device", browser: "Unknown browser", platform: "Unknown platform" };
  }

  const userAgent = navigator.userAgent;
  return {
    device: /Mobi|Android/i.test(userAgent) ? "Mobile" : "Desktop",
    browser: parseBrowser(userAgent),
    platform: navigator.platform || "Unknown platform",
  };
}

export async function touchIdentitySession(db: Firestore, uid: string) {
  const sessionId = getOrCreateSessionId();
  const ref = doc(db, "users", uid, "sessions", sessionId);
  const info = getDeviceInfo();
  await setDoc(
    ref,
    {
      ...info,
      active: true,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    },
    { merge: true }
  );
  return sessionId;
}

export async function getRecentIdentitySessions(db: Firestore, uid: string): Promise<IdentitySession[]> {
  const sessionsRef = collection(db, "users", uid, "sessions");
  const snapshot = await getDocs(query(sessionsRef, orderBy("lastSeen", "desc"), limit(8)));
  return snapshot.docs.map((session) => ({ id: session.id, ...(session.data() as Omit<IdentitySession, "id">) }));
}
