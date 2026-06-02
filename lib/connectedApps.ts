import { doc, runTransaction, serverTimestamp, type Firestore } from "firebase/firestore";

export const CONNECTED_APP_IDS = ["identity", "market", "drishya", "community", "creator"] as const;
export type ConnectedAppId = (typeof CONNECTED_APP_IDS)[number];

export type ConnectedAppRecord = {
  connected: boolean;
  firstSeen?: any;
  lastSeen?: any;
};

export type ConnectedAppsMap = Record<string, boolean | ConnectedAppRecord>;

export function isConnectedAppId(appId: string): appId is ConnectedAppId {
  return (CONNECTED_APP_IDS as readonly string[]).includes(appId);
}

export function normalizeConnectedApps(input?: ConnectedAppsMap | null): Record<ConnectedAppId, ConnectedAppRecord> {
  const source = input || {};
  return CONNECTED_APP_IDS.reduce((acc, appId) => {
    const value = source[appId];
    if (typeof value === "boolean") {
      acc[appId] = { connected: value };
    } else if (value && typeof value === "object") {
      acc[appId] = {
        connected: Boolean(value.connected),
        ...(value.firstSeen ? { firstSeen: value.firstSeen } : {}),
        ...(value.lastSeen ? { lastSeen: value.lastSeen } : {}),
      };
    } else {
      acc[appId] = { connected: false };
    }
    return acc;
  }, {} as Record<ConnectedAppId, ConnectedAppRecord>);
}

export async function registerConnectedApp(db: Firestore, uid: string, appId: ConnectedAppId) {
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);
    const existing = snap.exists() ? snap.data() : {};
    const connectedApps = normalizeConnectedApps(existing.connectedApps as ConnectedAppsMap);
    const previous = connectedApps[appId];
    const now = serverTimestamp();

    transaction.set(
      userRef,
      {
        ...(!snap.exists() ? { uid } : {}),
        connectedApps: {
          ...connectedApps,
          [appId]: {
            connected: true,
            firstSeen: previous.firstSeen || now,
            lastSeen: now,
          },
        },
        updatedAt: now,
      },
      { merge: true }
    );
  });
}
