import { Firestore, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ConnectedAppId, ConnectedAppState } from './identity';

export const CONNECTED_APPS: Array<{ id: ConnectedAppId; name: string; url: string }> = [
  { id: 'identity', name: 'Identity', url: 'https://identity.wildsaura.com' },
  { id: 'market', name: 'Market', url: 'https://market.wildsaura.com' },
  { id: 'drishya', name: 'Drishya', url: 'https://drishya.wildsaura.com' },
  { id: 'community', name: 'Community', url: 'https://community.wildsaura.com' },
  { id: 'creator', name: 'Creator Hub', url: 'https://creator.wildsaura.com' },
];

export function normalizeConnectedAppEntry(entry: unknown): ConnectedAppState {
  if (typeof entry === 'boolean') return { connected: entry };
  if (entry && typeof entry === 'object') {
    return entry as ConnectedAppState;
  }
  return { connected: false };
}

export async function registerConnectedApp(
  db: Firestore,
  uid: string,
  appId: ConnectedAppId = 'identity'
) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  const existing = normalizeConnectedAppEntry(snap.exists() ? snap.data()?.connectedApps?.[appId] : undefined);
  const now = serverTimestamp();

  await setDoc(userRef, {
    connectedApps: {
      [appId]: {
        connected: true,
        firstSeen: existing.firstSeen || now,
        lastSeen: now,
      },
    },
    updatedAt: now,
  }, { merge: true });
}
