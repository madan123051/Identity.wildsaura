import { doc, getDoc, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore';
import type { ConnectedAppId } from './identity';

export const CONNECTED_APPS: Array<{ id: ConnectedAppId; name: string; url: string }> = [
  { id: 'identity', name: 'Identity', url: 'https://identity.wildsaura.com' },
  { id: 'market', name: 'Market', url: 'https://market.wildsaura.com' },
  { id: 'drishya', name: 'Drishya', url: 'https://drishya.wildsaura.com' },
  { id: 'community', name: 'Community', url: 'https://community.wildsaura.com' },
  { id: 'creator', name: 'Creator Hub', url: 'https://creator.wildsaura.com' },
];

export function isAppConnected(value: any): boolean {
  if (value === true) return true;
  if (value && typeof value === 'object') return value.connected === true;
  return false;
}

export async function registerConnectedApp(
  db: Firestore,
  uid: string,
  appId: ConnectedAppId = 'identity'
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  const current = snap.exists() ? snap.data().connectedApps?.[appId] : null;
  const firstSeen = current && typeof current === 'object' && current.firstSeen
    ? current.firstSeen
    : serverTimestamp();

  await setDoc(userRef, {
    connectedApps: {
      [appId]: {
        connected: true,
        firstSeen,
        lastSeen: serverTimestamp(),
      },
    },
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
