import {
  Firestore,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

export type IdentitySession = {
  id: string;
  device: string;
  browser: string;
  platform: string;
  createdAt?: any;
  lastSeen?: any;
  active: boolean;
};

function getOrCreateSessionId(): string {
  const key = 'wildsaura_identity_session_id';
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(key, id);
  }
  return id;
}

function parseBrowser(userAgent: string): string {
  if (/Edg\//.test(userAgent)) return 'Microsoft Edge';
  if (/Chrome\//.test(userAgent)) return 'Chrome';
  if (/Firefox\//.test(userAgent)) return 'Firefox';
  if (/Safari\//.test(userAgent)) return 'Safari';
  return 'Unknown Browser';
}

function parseDevice(userAgent: string): string {
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'Mobile';
  return 'Desktop';
}

export async function touchIdentitySession(db: Firestore, uid: string) {
  if (typeof window === 'undefined') return;
  const sessionId = getOrCreateSessionId();
  const userAgent = window.navigator.userAgent;
  const sessionRef = doc(db, 'users', uid, 'sessions', sessionId);

  await setDoc(sessionRef, {
    device: parseDevice(userAgent),
    browser: parseBrowser(userAgent),
    platform: window.navigator.platform || 'Unknown Platform',
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
    active: true,
  }, { merge: true });
}

export async function getIdentitySessions(db: Firestore, uid: string): Promise<IdentitySession[]> {
  const q = query(collection(db, 'users', uid, 'sessions'), orderBy('lastSeen', 'desc'), limit(10));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as IdentitySession));
}
