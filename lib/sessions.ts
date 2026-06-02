import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore';

export interface IdentitySession {
  id: string;
  device: string;
  browser: string;
  platform: string;
  createdAt?: any;
  lastSeen?: any;
  active?: boolean;
}

function getOrCreateSessionId(uid: string): string {
  const key = `wildsaura_identity_session_${uid}`;
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const generated = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(key, generated);
  return generated;
}

function browserName(userAgent: string): string {
  if (userAgent.includes('Edg/')) return 'Microsoft Edge';
  if (userAgent.includes('Chrome/')) return 'Chrome';
  if (userAgent.includes('Firefox/')) return 'Firefox';
  if (userAgent.includes('Safari/')) return 'Safari';
  return 'Unknown Browser';
}

function deviceName(userAgent: string): string {
  if (/Mobi|Android/i.test(userAgent)) return 'Mobile';
  if (/Tablet|iPad/i.test(userAgent)) return 'Tablet';
  return 'Desktop';
}

export async function touchIdentitySession(db: Firestore, uid: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const userAgent = window.navigator.userAgent;
  const sessionId = getOrCreateSessionId(uid);
  const ref = doc(db, 'users', uid, 'sessions', sessionId);
  const snap = await getDoc(ref);
  await setDoc(ref, {
    device: deviceName(userAgent),
    browser: browserName(userAgent),
    platform: window.navigator.platform || 'Unknown Platform',
    createdAt: snap.exists() ? snap.data().createdAt || serverTimestamp() : serverTimestamp(),
    lastSeen: serverTimestamp(),
    active: true,
  }, { merge: true });
}

export async function getIdentitySessions(db: Firestore, uid: string): Promise<IdentitySession[]> {
  const sessionsRef = collection(db, 'users', uid, 'sessions');
  const snap = await getDocs(query(sessionsRef, orderBy('lastSeen', 'desc'), limit(10)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as IdentitySession));
}
